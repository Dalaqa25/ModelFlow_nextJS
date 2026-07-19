import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/auth/auth-utils";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

function sanitizePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function buildConversationQuery({
  userId,
  includeArchived,
  automationId,
  limit,
  offset,
  omitArchivedFilter = false,
  omitLastMessageSort = false,
}) {
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId);

  if (!omitArchivedFilter && !includeArchived) {
    query = query.eq('is_archived', false);
  }

  if (automationId) {
    query = query.eq('related_automation_id', automationId);
  }

  if (!omitLastMessageSort) {
    query = query.order('last_message_at', { ascending: false, nullsFirst: false });
  }

  return query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

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
    const limit = sanitizePositiveInt(searchParams.get('limit'), 15);
    const offset = sanitizePositiveInt(searchParams.get('offset'), 0);

    const attempts = [
      {
        label: 'full-query',
        omitArchivedFilter: false,
        omitLastMessageSort: false,
      },
      {
        label: 'without-archived-filter',
        omitArchivedFilter: true,
        omitLastMessageSort: false,
      },
      {
        label: 'created-at-sort-only',
        omitArchivedFilter: true,
        omitLastMessageSort: true,
      },
    ];

    let lastError = null;

    for (const attempt of attempts) {
      const { data, error } = await buildConversationQuery({
        userId: user.id,
        includeArchived,
        automationId,
        limit,
        offset,
        omitArchivedFilter: attempt.omitArchivedFilter,
        omitLastMessageSort: attempt.omitLastMessageSort,
      });

      if (!error) {
        if (attempt.label !== 'full-query') {
          console.warn('[GET /api/conversations] Fallback query used', {
            attempt: attempt.label,
            userId: user.id,
            automationId,
            includeArchived,
            limit,
            offset,
          });
        }
        return NextResponse.json(data ?? []);
      }

      lastError = error;
      console.error('[GET /api/conversations] Query attempt failed', {
        attempt: attempt.label,
        userId: user.id,
        automationId,
        includeArchived,
        limit,
        offset,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }

    throw lastError ?? new Error('Unknown conversations query failure');
  } catch (error) {
    console.error('[GET /api/conversations] Unhandled error', error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        ...(process.env.NODE_ENV !== 'production'
          ? {
              details: error?.message ?? 'Unknown error',
            }
          : {}),
      },
      { status: 500 }
    );
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
