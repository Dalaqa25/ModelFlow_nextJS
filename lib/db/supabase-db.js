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
      .single();
    
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
  }
};

// Model operations
export const modelDB = {
  // Get all models
  async getAllModels() {
    const { data, error } = await supabase
      .from('models')
      .select('*')
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
    
    if (error) throw error;
    return data;
  },

  // Get model by ID
  async getModelById(id) {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
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

// Pending Model operations
export const pendingModelDB = {
  // Get all pending models
  async getAllPendingModels() {
    const { data, error } = await supabase
      .from('pending_models')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get pending models by author
  async getPendingModelsByAuthor(email) {
    const { data, error } = await supabase
      .from('pending_models')
      .select('*')
      .eq('author_email', email)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create pending model
  async createPendingModel(modelData) {
    const { data, error } = await supabase
      .from('pending_models')
      .insert(modelData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Approve pending model (move to models table)
  async approvePendingModel(id) {
    // First get the pending model
    const { data: pendingModel, error: fetchError } = await supabase
      .from('pending_models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    // Insert into models table
    const { data: newModel, error: insertError } = await supabase
      .from('models')
      .insert(pendingModel)
      .select()
      .single();
    
    if (insertError) throw insertError;

    // Delete from pending models
    const { error: deleteError } = await supabase
      .from('pending_models')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;

    return newModel;
  }
};

// Archived Model operations
export const archivedModelDB = {
  // Get archived models by author
  async getArchivedModelsByAuthor(email) {
    const { data, error } = await supabase
      .from('archived_models')
      .select('*')
      .eq('author_email', email)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Archive model (move from models to archived_models)
  async archiveModel(id) {
    // First get the model
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    // Insert into archived_models table
    const { data: archivedModel, error: insertError } = await supabase
      .from('archived_models')
      .insert(model)
      .select()
      .single();
    
    if (insertError) throw insertError;

    // Delete from models table
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;

    return archivedModel;
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

// Purchase operations
export const purchaseDB = {
  // Get purchased models by user
  async getPurchasedModelsByUser(email) {
    const { data, error } = await supabase
      .from('purchased_models')
      .select('*')
      .eq('user_email', email)
      .order('purchased_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create purchase record
  async createPurchase(purchaseData) {
    const { data, error } = await supabase
      .from('purchased_models')
      .insert(purchaseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Request operations
export const requestDB = {
  // Get all requests
  async getAllRequests() {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
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
  }
};

// Export the main client for direct use
export { supabase };
