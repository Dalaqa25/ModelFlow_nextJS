import { NextResponse } from 'next/server';
import { validateUsername } from '@/lib/validation-utils';
import { userDB } from '@/lib/db/supabase-db';

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 });
    }

    // Validate username format first
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return NextResponse.json({ 
        available: false,
        errors: validation.errors,
        message: 'Username format is invalid'
      });
    }

    const existingUser = await userDB.getUserByName(username);
    const isAvailable = !existingUser;

    return NextResponse.json({ 
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });

  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
