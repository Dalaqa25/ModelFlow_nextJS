// Shared helpers and supabase client used across all handler files
import { createClient } from '@supabase/supabase-js';

// Only log in development — silent in production
export const log = process.env.NODE_ENV === 'production'
  ? () => {}
  : console.log;

export const logError = console.error; // Always log errors regardless of environment

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to send SSE data
export const sendSSE = (controller, encoder, data) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

export function parseRequiredInputs(inputs) {
  log('[parseRequiredInputs] Raw inputs:', inputs, 'Type:', typeof inputs);
  if (!inputs) return [];
  if (Array.isArray(inputs) && inputs.length > 0 && typeof inputs[0] === 'string') {
    try { return inputs.map(input => JSON.parse(input)); } catch (e) { }
  }
  // Ensure we always return an array
  if (Array.isArray(inputs)) return inputs;
  log('[parseRequiredInputs] Inputs is not an array, returning empty array');
  return [];
}

export function parseConnectors(connectors) {
  if (!connectors) return [];
  if (typeof connectors === 'string') {
    try { return JSON.parse(connectors); }
    catch (e) { return connectors.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return Array.isArray(connectors) ? connectors : [];
}

export function getAutomationStoragePath(userId, automationId) {
  // Single folder: user_id_automation_id/
  return `${userId}_${automationId}/`;
}

export async function getValidProviderToken(provider, integration, userId, automationId) {
  if (provider === 'tiktok') {
    try {
      const { getValidTikTokAccessToken } = await import('@/lib/auth/tiktok-oauth');
      return await getValidTikTokAccessToken(userId);
    } catch (error) {
      logError('TikTok token error:', error);
      return null;
    }
  }

  // Default to Google logic
  const { access_token: accessToken, refresh_token: refreshToken, token_expiry: tokenExpiry } = integration;
  // Consider token expired if it's within 5 minutes of actual expiry to allow for refresh time
  const isExpired = !tokenExpiry || new Date(tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000);

  if (isExpired && refreshToken) {
    log('[TOKEN DEBUG] Token expired, refreshing via Google...');
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json();
      log('[TOKEN DEBUG] Refresh successful');

      const { createClient } = await import('@/lib/db/supabase-server');
      const supabase = createClient();

      if (automationId) {
        await supabase.from('user_automations').update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq('user_id', userId).eq('automation_id', automationId).eq('provider', 'google');
      } else {
        // Update all Google automations for this user
        await supabase.from('user_automations').update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq('user_id', userId).eq('provider', 'google');
      }
      return tokens.access_token;
    } else {
      const errorData = await refreshResponse.text();
      log('[TOKEN DEBUG] Refresh FAILED:', {
        status: refreshResponse.status,
        error: errorData
      });

      if (errorData.includes('invalid_grant')) {
        const { createClient } = await import('@/lib/db/supabase-server');
        const supabase = createClient();
        if (automationId) {
          await supabase.from('user_automations')
            .update({ access_token: null, refresh_token: null, token_expiry: null })
            .eq('user_id', userId).eq('automation_id', automationId).eq('provider', 'google');
        } else {
          await supabase.from('user_automations')
            .update({ access_token: null, refresh_token: null, token_expiry: null })
            .eq('user_id', userId).eq('provider', 'google');
        }
        return 'NEEDS_RECONNECT';
      }
      return null;
    }
  }
  return accessToken;
}
