import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to use AI features' },
        { status: 401 }
      );
    }

    // AI generation disabled
    return NextResponse.json(
      { error: 'AI generation is disabled.' },
      { status: 503 }
    );

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check available models and service status
export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      configured: false,
      message: 'AI generation is disabled.',
    }, { status: 503 });

  } catch (error) {
    console.error('Error checking AI service:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

