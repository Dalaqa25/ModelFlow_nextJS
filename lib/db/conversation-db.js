// Helper functions for conversation database operations
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const conversationDB = {
  // Create a new conversation
  async createConversation(userId, automationId = null) {
    let title = 'New Conversation';
    
    // If automation is linked, use its name as title
    if (automationId) {
      const { data: automation } = await supabase
        .from('automations')
        .select('name')
        .eq('id', automationId)
        .single();
      
      if (automation) {
        title = automation.name;
      }
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        related_automation_id: automationId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get conversation with messages
  async getConversation(conversationId, userId) {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError) throw convError;

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return {
      ...conversation,
      messages: messages || []
    };
  },

  // Save a message
  async saveMessage(conversationId, userId, role, content, metadata = {}) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // List user's conversations
  async listConversations(userId, includeArchived = false) {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update conversation title
  async updateConversation(conversationId, userId, updates) {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete conversation
  async deleteConversation(conversationId, userId) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
};
