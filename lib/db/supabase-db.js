import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for full database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// User operations
export const userDB = {
  // Get user by email
  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create or update user
  async upsertUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'email' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user by username (stored in name field)
  async getUserByName(name) {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(email, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Notification operations
export const notificationDB = {
  // Get notifications by user
  async getNotificationsByUser(email) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  },

  // Create notification
  async createNotification(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark notifications as read
  async markNotificationsAsRead(notificationIds) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds);
    
    if (error) throw error;
    return true;
  },

  // Delete notifications
  async deleteNotifications(notificationIds) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);
    
    if (error) throw error;
    return true;
  }
};

// Request operations
export const requestDB = {
  // Get all requests
  async getAllRequests() {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        request_comments(count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const transformedData = data.map(request => ({
      ...request,
      commentsCount: request.request_comments?.[0]?.count || 0
    }));
    
    return transformedData;
  },

  // Get requests by author
  async getRequestsByAuthor(email) {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('author_email', email)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create request
  async createRequest(requestData) {
    const { data, error } = await supabase
      .from('requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get request by ID
  async getRequestById(id) {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Delete request
  async deleteRequest(id) {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// Request Comment operations
export const requestCommentDB = {
  // Get comments by request ID, including author details
  async getCommentsByRequestId(requestId) {
    const { data, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        author:users(name, profile_image_url)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create a new comment
  async createComment(commentData) {
    const { data, error } = await supabase
      .from('request_comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a comment
  async deleteComment(id) {
    const { error } = await supabase
      .from('request_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// User Integration (OAuth) operations
export const userIntegrationDB = {
  // Get integration by user ID and provider
  async getIntegrationByUserAndProvider(userId, provider) {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get integration by provider user ID
  async getIntegrationByProviderUserId(providerUserId, provider) {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('provider_user_id', providerUserId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create or update integration (upsert)
  async upsertIntegration(integrationData) {
    const { data, error } = await supabase
      .from('user_integrations')
      .upsert(integrationData, { 
        onConflict: 'user_id,provider',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update integration tokens
  async updateIntegrationTokens(userId, provider, tokenData) {
    const { data, error } = await supabase
      .from('user_integrations')
      .update({
        ...tokenData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', provider)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all integrations for a user
  async getIntegrationsByUser(userId) {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Delete integration
  async deleteIntegration(userId, provider) {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;
    return true;
  }
};

// Export the main client for direct use
export { supabase };
