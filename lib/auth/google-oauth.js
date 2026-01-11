import { userIntegrationDB } from '@/lib/db/supabase-db';

/**
 * Refresh Google access token using refresh token
 */
export async function refreshGoogleAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh token: ${errorData}`);
  }

  const data = await response.json();
  return { access_token: data.access_token, expires_in: data.expires_in };
}

/**
 * Get a valid Google access token for a user (auto-refreshes if expired)
 */
export async function getValidGoogleAccessToken(userId) {
  const integration = await userIntegrationDB.getIntegrationByUserAndProvider(userId, 'google');

  if (!integration) throw new Error('Google integration not found for user');
  if (!integration.refresh_token) throw new Error('No refresh token available');

  const now = new Date();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
    const { access_token, expires_in } = await refreshGoogleAccessToken(integration.refresh_token);
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await userIntegrationDB.updateIntegrationTokens(userId, 'google', {
      access_token,
      expires_at: newExpiresAt,
    });

    return access_token;
  }

  return integration.access_token;
}

/**
 * Check if a Google access token is expired or expiring soon
 */
export async function isGoogleAccessTokenExpired(userId) {
  const integration = await userIntegrationDB.getIntegrationByUserAndProvider(userId, 'google');
  if (!integration || !integration.expires_at) return true;

  const expiresAt = new Date(integration.expires_at);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}
