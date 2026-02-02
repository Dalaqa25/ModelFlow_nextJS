import { NextResponse } from 'next/server';
import { getScopesForServices } from '@/lib/auth/scope-manager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automation_id');
    const userId = searchParams.get('user_id');
    const requiredServices = searchParams.get('services'); // NEW: comma-separated list

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
      return NextResponse.json({ 
        error: 'GOOGLE_CLIENT_ID is not set in environment variables' 
      }, { status: 500 });
    }

    // SMART OAUTH: Determine which scopes to request
    let scopes;
    let scopeSource = 'default';
    
    // Option 1: Automation ID provided - fetch its required scopes
    if (automationId) {
      try {
        const { automationDB } = await import('@/lib/db/automation-db');
        const automation = await automationDB.getAutomationWithScopes(automationId);
        
        if (automation && automation.required_scopes && automation.required_scopes.length > 0) {
          scopes = getScopesForServices(automation.required_scopes);
          scopeSource = `automation:${automation.name}`;
          console.log(`Requesting scopes for automation "${automation.name}":`, automation.required_scopes);
        }
      } catch (error) {
        console.error('Failed to fetch automation scopes:', error);
      }
    }
    
    // Option 2: Services explicitly provided
    if (!scopes && requiredServices) {
      const services = requiredServices.split(',').map(s => s.trim().toUpperCase());
      scopes = getScopesForServices(services);
      scopeSource = `explicit:${services.join(',')}`;
      console.log(`Requesting scopes for services: ${services.join(', ')}`);
    }
    
    // Option 3: Fallback to safe defaults (most common use case)
    if (!scopes) {
      scopes = getScopesForServices(['DRIVE', 'SHEETS', 'GMAIL']);
      scopeSource = 'default:safe';
      console.log('Using safe default scopes: DRIVE, SHEETS, GMAIL');
    }

    // Construct Google OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    
    // Pass automation_id, user_id, and scope_source through state
    const state = Buffer.from(JSON.stringify({ 
      automation_id: automationId,
      user_id: userId,
      scope_source: scopeSource
    })).toString('base64');
    authUrl.searchParams.set('state', state);
    
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // Required to get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to ensure refresh token
    
    // IMPORTANT: Include existing scopes to avoid losing access
    // Google will merge new scopes with existing ones
    authUrl.searchParams.set('include_granted_scopes', 'true');

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to initiate Google OAuth',
      details: error.message 
    }, { status: 500 });
  }
}
