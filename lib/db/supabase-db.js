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
    return data; // Will be null if user doesn't exist
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
    return data; // null if not found
  },

  // Update user subscription
  async updateUserSubscription(email, subscriptionData) {
    const { data, error } = await supabase
      .from('users')
      .update({ subscription: subscriptionData })
      .eq('email', email)
      .select()
      .single();
    
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

// Model operations
export const modelDB = {
  // Get all models
  async getAllModels() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get models by author
  async getModelsByAuthor(email) {
    
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('author_email', email)
      .order('created_at', { ascending: false });
    
    
    if (error) {
      console.error('🔍 [DB] Supabase error:', error);
      throw error;
    }
    return data;
  },

  // Get model by ID
  async getModelById(id) {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) throw error;
    return data; // Will be null if model doesn't exist
  },

  // Create new model
  async createModel(modelData) {
    const { data, error } = await supabase
      .from('models')
      .insert(modelData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update model
  async updateModel(id, updateData) {
    const { data, error } = await supabase
      .from('models')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete model
  async deleteModel(id) {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
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
    
    // Transform the data to add commentsCount
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

    if (error) {
      console.error('[DB] Supabase error:', error);
      throw error;
    }

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
    return data; // Will be null if request doesn't exist
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


// Withdrawal operations
export const withdrawalDB = {
  // Create withdrawal request
  async createWithdrawalRequest(withdrawalData) {

    const { data, error } = await supabase
      .from('withdrawals')
      .insert(withdrawalData)
      .select()
      .single();


    if (error) {
      console.error('🚨 [withdrawalDB] Supabase error:', error);
      throw error;
    }

    return data;
  },

  // Get withdrawal requests by user
  async getWithdrawalsByUser(email) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all withdrawal requests (admin only)
  async getAllWithdrawals() {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get withdrawal by ID
  async getWithdrawalById(id) {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update withdrawal status with timestamp
  async updateWithdrawalStatus(id, status) {
    const updateData = { status };
    
    // Add appropriate timestamp based on status
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Purchase/Transaction operations
export const purchaseDB = {
  // Get purchased models by user
  async getPurchasedModelsByUser(email) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        created_at,
        model_id,
        price,
        model:models(
          id,
          name,
          author_email,
          tags,
          price,
          file_storage
        )
      `)
      .eq('buyer_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create purchase transaction
  async createPurchase(transactionData) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Earnings operations
export const earningsDB = {
  // Get earnings history by user
  async getEarningsHistoryByUser(email) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        model:models(name),
        buyer:users!transactions_buyer_email_fkey(name, email)
      `)
      .eq('seller_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Model Likes operations
export const modelLikeDB = {
  // Check if user has liked a model
  async hasUserLikedModel(modelId, userEmail) {
    const { data, error } = await supabase
      .from('model_likes')
      .select('id')
      .eq('model_id', modelId)
      .eq('user_email', userEmail)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Add like to model
  async addLike(modelId, userEmail) {
    const { data, error } = await supabase
      .from('model_likes')
      .insert({
        model_id: modelId,
        user_email: userEmail
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove like from model
  async removeLike(modelId, userEmail) {
    const { error } = await supabase
      .from('model_likes')
      .delete()
      .eq('model_id', modelId)
      .eq('user_email', userEmail);

    if (error) throw error;
    return true;
  },

  // Get like count for a model
  async getLikeCount(modelId) {
    const { count, error } = await supabase
      .from('model_likes')
      .select('*', { count: 'exact', head: true })
      .eq('model_id', modelId);

    if (error) throw error;
    return count || 0;
  },

  // Get models liked by user
  async getLikedModelsByUser(userEmail) {
    const { data, error } = await supabase
      .from('model_likes')
      .select(`
        model_id,
        created_at,
        model:models(*)
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Export the main client for direct use
export { supabase };
