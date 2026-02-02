import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
 * Gets the first available Google automation token for the user
 */
export async function getValidGoogleAccessToken(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('access_token, refresh_token, token_expiry, automation_id')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration) throw new Error('Google integration not found for user');
  if (!integration.refresh_token) throw new Error('No refresh token available');

  const now = new Date();
  const expiresAt = integration.token_expiry ? new Date(integration.token_expiry) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
    const { access_token, expires_in } = await refreshGoogleAccessToken(integration.refresh_token);
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update all Google automations for this user with the new token
    await supabase
      .from('user_automations')
      .update({
        access_token,
        token_expiry: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    return access_token;
  }

  return integration.access_token;
}

/**
 * Check if a Google access token is expired or expiring soon
 */
export async function isGoogleAccessTokenExpired(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('token_expiry')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration || !integration.token_expiry) return true;

  const expiresAt = new Date(integration.token_expiry);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}

