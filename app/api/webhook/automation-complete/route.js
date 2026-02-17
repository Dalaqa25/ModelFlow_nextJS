import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Webhook endpoint for automation-runner to notify when a scheduled automation completes
 * 
 * Expected payload:
 * {
 *   jobId: string,
 *   automation_id: string,
 *   user_id: string,
 *   status: 'success' | 'failed',
 *   result: any,
 *   error: string (if failed),
 *   executedAt: ISO timestamp
 * }
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    
    console.log('[Webhook] Automation complete:', {
      jobId: payload.jobId,
      automation_id: payload.automation_id,
      user_id: payload.user_id,
      status: payload.status
    });

    const { jobId, automation_id, user_id, status, result, error, executedAt } = payload;

    if (!automation_id || !user_id || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: automation_id, user_id, status' 
      }, { status: 400 });
    }

    // Get automation name
    const { data: automation } = await supabase
      .from('automations')
      .select('name')
      .eq('id', automation_id)
      .single();

    const automationName = automation?.name || 'Automation';

    // Get user email for notification
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();

    if (!user?.email) {
      console.error('[Webhook] User not found:', user_id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create notification
    let notificationMessage;
    let notificationType;

    if (status === 'success') {
      notificationMessage = `✅ ${automationName} completed successfully`;
      notificationType = 'success';
      
      // Add result details if available
      if (result && typeof result === 'object') {
        if (result.message) {
          notificationMessage += `: ${result.message}`;
        } else if (result.postsCreated) {
          notificationMessage += ` - ${result.postsCreated} posts created`;
        }
      }
    } else {
      notificationMessage = `❌ ${automationName} failed`;
      notificationType = 'error';
      
      if (error) {
        notificationMessage += `: ${error}`;
      }
    }

    // Insert notification into database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_email: user.email,
        message: notificationMessage,
        type: notificationType,
        metadata: {
          automation_id,
          jobId,
          status,
          result,
          error,
          executedAt
        },
        created_at: new Date().toISOString()
      });

    if (notifError) {
      console.error('[Webhook] Failed to create notification:', notifError);
      return NextResponse.json({ 
        error: 'Failed to create notification',
        details: notifError.message 
      }, { status: 500 });
    }

    console.log('[Webhook] Notification created for user:', user.email);

    return NextResponse.json({ 
      success: true,
      message: 'Notification created'
    });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
