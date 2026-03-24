import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh LinkedIn access token using refresh token
 * Note: LinkedIn refresh tokens are long-lived (1 year) and only provided
 * if r_basicprofile or w_member_social scopes are granted with offline_access.
 */
export async function refreshLinkedInAccessToken(refreshToken) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh LinkedIn token: ${errorData}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`LinkedIn refresh error: ${data.error_description || data.error}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in,
  };
}

/**
 * Get a valid LinkedIn access token for a user (auto-refreshes if expired)
 * Gets the first available LinkedIn automation token for the user
 */
export async function getValidLinkedInAccessToken(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('access_token, refresh_token, token_expiry, automation_id')
    .eq('user_id', userId)
    .eq('provider', 'linkedin')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration) {
    throw new Error('LinkedIn integration not found for user');
  }
  if (!integration.refresh_token) {
    throw new Error('No LinkedIn refresh token available');
  }

  const now = new Date();
  const expiresAt = integration.token_expiry ? new Date(integration.token_expiry) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
    console.log('Refreshing LinkedIn access token...');

    const { access_token, refresh_token, expires_in } = await refreshLinkedInAccessToken(
      integration.refresh_token
    );

    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await supabase
      .from('user_automations')
      .update({
        access_token,
        refresh_token: refresh_token || integration.refresh_token,
        token_expiry: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'linkedin');

    console.log('LinkedIn token refreshed successfully');
    return access_token;
  }

  return integration.access_token;
}

/**
 * Check if a LinkedIn access token is expired or expiring soon
 */
export async function isLinkedInAccessTokenExpired(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('token_expiry')
    .eq('user_id', userId)
    .eq('provider', 'linkedin')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration || !integration.token_expiry) return true;

  const expiresAt = new Date(integration.token_expiry);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Get LinkedIn member profile using access token
 */
export async function getLinkedInUserInfo(accessToken) {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get LinkedIn user info: ${errorData}`);
  }

  return await response.json();
}
