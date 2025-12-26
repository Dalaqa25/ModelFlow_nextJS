import { createServerComponentClient } from './supabase-server';

export async function getSupabaseUser() {
  try {
    const supabase = await createServerComponentClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    if (user) {
      return {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      };
    }

    return null;
  } catch (error) {
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
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
}