import { createServerComponentClient } from './supabase-server';

export async function getSupabaseUser() {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    console.log('getSupabaseUser - User found:', user ? {
      id: user.id,
      email: user.email,
      hasMetadata: !!user.user_metadata
    } : 'No user');
    
    return user;
  } catch (error) {
    console.error('getSupabaseUser - Exception:', error);
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