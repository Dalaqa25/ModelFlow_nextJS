import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh TikTok access token using refresh token
 */
export async function refreshTikTokAccessToken(refreshToken) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh TikTok token: ${errorData}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`TikTok refresh error: ${data.error_description || data.error}`);
  }

  const tokenData = data.data || data;
  return { 
    access_token: tokenData.access_token, 
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in 
  };
}

/**
 * Get a valid TikTok access token for a user (auto-refreshes if expired)
 * Gets the first available TikTok automation token for the user
 */
export async function getValidTikTokAccessToken(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('access_token, refresh_token, token_expiry, automation_id')
    .eq('user_id', userId)
    .eq('provider', 'tiktok')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration) {
    throw new Error('TikTok integration not found for user');
  }
  
  if (!integration.refresh_token) {
    throw new Error('No TikTok refresh token available');
  }

  const now = new Date();
  const expiresAt = integration.token_expiry ? new Date(integration.token_expiry) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Refresh if token is expired or expiring soon
  if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
    console.log('Refreshing TikTok access token...');
    
    const { access_token, refresh_token, expires_in } = await refreshTikTokAccessToken(
      integration.refresh_token
    );
    
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update all TikTok automations for this user with the new token
    await supabase
      .from('user_automations')
      .update({
        access_token,
        refresh_token: refresh_token || integration.refresh_token, // Use new refresh token if provided
        token_expiry: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'tiktok');

    console.log('TikTok token refreshed successfully');
    return access_token;
  }

  return integration.access_token;
}

/**
 * Check if a TikTok access token is expired or expiring soon
 */
export async function isTikTokAccessTokenExpired(userId) {
  const { data: integration } = await supabase
    .from('user_automations')
    .select('token_expiry')
    .eq('user_id', userId)
    .eq('provider', 'tiktok')
    .not('access_token', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!integration || !integration.token_expiry) return true;

  const expiresAt = new Date(integration.token_expiry);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt <= fiveMinutesFromNow;
}

/**
 * Get TikTok user info using access token
 */
export async function getTikTokUserInfo(accessToken) {
  const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get TikTok user info: ${errorData}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`TikTok API error: ${data.error.message}`);
  }

  return data.data.user;
}
