import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth/auth-utils";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

// GET - List user's conversations
export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('archived') === 'true';
    const automationId = searchParams.get('automationId');

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (automationId) {
      query = query.eq('related_automation_id', automationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create new conversation
export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, relatedAutomationId } = body;

    let conversationTitle = title || 'New Conversation';

    // If automation is linked, use automation name as title
    if (relatedAutomationId) {
      const { data: automation } = await supabase
        .from('automations')
        .select('name')
        .eq('id', relatedAutomationId)
        .single();

      if (automation) {
        conversationTitle = automation.name;
      }
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: conversationTitle,
        related_automation_id: relatedAutomationId || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
