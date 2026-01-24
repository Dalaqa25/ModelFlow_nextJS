import { NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/n8n-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('id') || 'cArxYSmIYgF2tfqm';
    
    const credential = await n8nClient.getCredential(credentialId);
    
    return NextResponse.json(credential, null, 2);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
