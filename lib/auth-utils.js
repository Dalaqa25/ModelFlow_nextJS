import { createServerComponentClient } from './supabase-server';

export async function getSupabaseUser() {
  try {
    console.log('🔍 AUTH DEBUG - getSupabaseUser called');
    const supabase = await createServerComponentClient();
    console.log('  - Supabase client created successfully');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('  - Auth response error:', error);
    console.log('  - Auth response user:', user ? {
      id: user.id,
      email: user.email,
      aud: user.aud,
      role: user.role,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    } : 'null');
    
    if (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
    
    if (user) {
      console.log('✅ getSupabaseUser - User found:', {
        id: user.id,
        email: user.email,
        hasMetadata: !!user.user_metadata
      });
    } else {
      console.log('❌ getSupabaseUser - No user found');
    }
    
    return user;
  } catch (error) {
    console.error('❌ getSupabaseUser - Exception:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getSupabaseUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function getSupabaseSession() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    console.log('getSupabaseSession - Session found:', session ? 'Yes' : 'No');
    return session;
  } catch (error) {
    console.error('getSupabaseSession - Exception:', error);
    return null;
  }
}