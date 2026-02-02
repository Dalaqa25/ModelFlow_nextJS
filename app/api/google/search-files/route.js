import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, fileType } = await req.json();

    // Get user's Google tokens from user_automations (any automation with Google connected)
    const { data: integration, error: integrationError } = await supabase
      .from('user_automations')
      .select('access_token, refresh_token, token_expiry')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .limit(1)
      .maybeSingle();

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'Google not connected',
        needsConnection: true 
      }, { status: 400 });
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    if (new Date(integration.token_expiry) < new Date()) {
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to refresh Google token',
          needsConnection: true 
        }, { status: 400 });
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      // Update stored tokens for all Google automations
      await supabase
        .from('user_automations')
        .update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'google');
    }

    // Build Google Drive search query
    let driveQuery = `name contains '${query}' and trashed = false`;
    
    // Filter by file type if specified
    if (fileType === 'spreadsheet') {
      driveQuery += ` and mimeType = 'application/vnd.google-apps.spreadsheet'`;
    } else if (fileType === 'document') {
      driveQuery += ` and mimeType = 'application/vnd.google-apps.document'`;
    } else if (fileType === 'folder') {
      driveQuery += ` and mimeType = 'application/vnd.google-apps.folder'`;
    }

    // Search Google Drive
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!driveResponse.ok) {
      const error = await driveResponse.json();
      return NextResponse.json({ error: 'Failed to search Drive', details: error }, { status: 500 });
    }

    const driveData = await driveResponse.json();
    
    return NextResponse.json({
      files: driveData.files || [],
      query,
      fileType
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
