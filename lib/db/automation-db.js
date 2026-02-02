/**
 * Automation Database Operations
 * Handles all automation-related database queries
 * SIMPLIFIED: Uses existing user_automations table (no separate token table needed)
 */

import { supabase } from './supabase-db';

export const automationDB = {
  /**
   * Get automation by ID
   */
  async getAutomationById(id) {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get automation with required scopes
   */
  async getAutomationWithScopes(id) {
    const { data, error } = await supabase
      .from('automations')
      .select('id, name, required_scopes, workflow')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update automation's required scopes
   */
  async updateRequiredScopes(id, requiredScopes) {
    const { data, error } = await supabase
      .from('automations')
      .update({ required_scopes: requiredScopes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all automations with their required scopes
   */
  async getAllAutomationsWithScopes() {
    const { data, error } = await supabase
      .from('automations')
      .select('id, name, required_scopes, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

/**
 * User Automation Database Operations
 * Uses existing user_automations table (already has tokens per automation)
 */
export const userAutomationDB = {
  /**
   * Get user's automation connection (tokens + scopes)
   */
  async getUserAutomation(userId, automationId) {
    const { data, error } = await supabase
      .from('user_automations')
      .select('*')
      .eq('user_id', userId)
      .eq('automation_id', automationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Upsert user automation with granted scopes
   */
  async upsertUserAutomation(userAutomationData) {
    const { data, error } = await supabase
      .from('user_automations')
      .upsert(userAutomationData, { onConflict: 'user_id,automation_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update granted scopes for user automation
   */
  async updateGrantedScopes(userId, automationId, grantedScopes) {
    const { data, error } = await supabase
      .from('user_automations')
      .update({ 
        granted_scopes: grantedScopes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('automation_id', automationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check if user has required scopes for an automation
   */
  async checkUserHasScopes(userId, automationId, requiredServices) {
    const userAutomation = await this.getUserAutomation(userId, automationId);
    
    if (!userAutomation || !userAutomation.granted_scopes) {
      return {
        hasAllScopes: false,
        missingServices: requiredServices,
        grantedScopes: []
      };
    }

    const grantedScopes = userAutomation.granted_scopes;
    const missingServices = [];

    // Check each required service
    for (const service of requiredServices) {
      const hasService = grantedScopes.some(scope => 
        scope.includes(service.toLowerCase())
      );
      
      if (!hasService) {
        missingServices.push(service);
      }
    }

    return {
      hasAllScopes: missingServices.length === 0,
      missingServices,
      grantedScopes
    };
  },

  /**
   * Delete user automation (revoke access)
   */
  async deleteUserAutomation(userId, automationId) {
    const { error } = await supabase
      .from('user_automations')
      .delete()
      .eq('user_id', userId)
      .eq('automation_id', automationId);

    if (error) throw error;
    return true;
  }
};
