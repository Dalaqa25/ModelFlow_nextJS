import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_API_KEY = process.env['X-N8N-API-KEY'];

export const dynamic = 'force-dynamic';

/**
 * GET /api/automations/n8n/workflows
 * Fetches all workflows from n8n
 */
export async function GET(request) {
  try {
    // Verify user is authenticated
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check n8n configuration
    if (!N8N_BASE_URL || !N8N_API_KEY) {
      return NextResponse.json(
        { error: 'n8n is not configured' },
        { status: 500 }
      );
    }

    // Fetch workflows from n8n
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch workflows from n8n' },
        { status: response.status }
      );
    }

    const workflows = await response.json();
    
    return NextResponse.json({
      success: true,
      workflows: workflows.data || workflows,
      count: workflows.data?.length || workflows.length || 0
    });

  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
