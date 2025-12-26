import { userIntegrationDB } from './db/supabase-db';

/**
 * Refresh Google access token using refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{access_token: string, expires_in: number}>}
 */
export async function refreshGoogleAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
  return {
    access_token: data.access_token,
    expires_in: data.expires_in, // in seconds
  };
}

/**
 * Get a valid Google access token for a user
 * Automatically refreshes if expired or expiring soon
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<string>} - Valid access token
 */
export async function getValidGoogleAccessToken(userId) {
  // Get the integration from database
  const integration = await userIntegrationDB.getIntegrationByUserAndProvider(
    userId,
    'google'
  );

  if (!integration) {
    throw new Error('Google integration not found for user');
  }

  if (!integration.refresh_token) {
    throw new Error('No refresh token available');
  }

  // Check if access token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // If token is expired or will expire soon, refresh it
  if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
    try {
      const { access_token, expires_in } = await refreshGoogleAccessToken(
        integration.refresh_token
      );

      // Calculate new expiration time
      const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      // Update the database
      await userIntegrationDB.updateIntegrationTokens(userId, 'google', {
        access_token: access_token,
        expires_at: newExpiresAt,
      });

      return access_token;
    } catch (error) {
      throw error;
    }
  }

  // Token is still valid
  return integration.access_token;
}

/**
 * Check if a Google access token is expired or expiring soon
 * @param {string} userId - User ID (UUID)
 * @returns {Promise<boolean>} - True if expired or will expire soon
 */
export async function isGoogleAccessTokenExpired(userId) {
  const integration = await userIntegrationDB.getIntegrationByUserAndProvider(
    userId,
    'google'
  );

  if (!integration || !integration.expires_at) {
    return true; // Consider expired if no expiration date
  }

  const now = new Date();
  const expiresAt = new Date(integration.expires_at);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiresAt <= fiveMinutesFromNow;
}

