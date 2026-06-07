import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { createAdminClient } from '@/lib/db/supabase-server';
import { ensureActivepiecesUserForModelGrowUser } from '@/lib/activepieces/provisioning';
import { isActivepiecesConfigured } from '@/lib/activepieces/client';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

function parseLimit(value) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

async function requireAdmin() {
  const user = await getSupabaseUser();
  if (!isAdminEmail(user?.email)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!isActivepiecesConfigured()) {
    return { error: NextResponse.json({ error: 'Activepieces is not configured' }, { status: 500 }) };
  }
  return { user };
}

async function getBackfillCandidates({ supabase, limit }) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      activepieces_user_links (
        status,
        activepieces_project_id
      )
    `)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) throw error;

  const readyEmails = new Set();
  for (const user of data || []) {
    const link = Array.isArray(user.activepieces_user_links)
      ? user.activepieces_user_links[0]
      : user.activepieces_user_links;
    if (link?.status === 'ready' && link?.activepieces_project_id) {
      const normalizedEmail = String(user.email || '').trim().toLowerCase();
      if (normalizedEmail) readyEmails.add(normalizedEmail);
    }
  }

  const candidates = (data || [])
    .filter((user) => {
      const normalizedEmail = String(user.email || '').trim().toLowerCase();
      if (readyEmails.has(normalizedEmail)) return false;

      const link = Array.isArray(user.activepieces_user_links)
        ? user.activepieces_user_links[0]
        : user.activepieces_user_links;
      return !(link?.status === 'ready' && link?.activepieces_project_id);
    })
    .map(({ activepieces_user_links, ...user }) => user);

  const byEmail = new Map();
  for (const user of candidates) {
    const normalizedEmail = String(user.email || '').trim().toLowerCase();
    if (!normalizedEmail) continue;

    const existing = byEmail.get(normalizedEmail);
    const isExactLowercase = user.email === normalizedEmail;
    const existingIsExactLowercase = existing?.email === normalizedEmail;

    if (!existing || (isExactLowercase && !existingIsExactLowercase)) {
      byEmail.set(normalizedEmail, user);
    }
  }

  return Array.from(byEmail.values()).slice(0, limit);
}

export async function GET(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    const candidates = await getBackfillCandidates({ supabase, limit });

    return NextResponse.json({
      dryRun: true,
      limit,
      pendingCount: candidates.length,
      candidates: candidates.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
      })),
    });
  } catch (error) {
    console.error('[Activepieces Backfill GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to inspect backfill users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const limit = parseLimit(body?.limit);
    const supabase = createAdminClient();
    const candidates = await getBackfillCandidates({ supabase, limit });

    const results = [];
    let ready = 0;
    let failed = 0;

    for (const user of candidates) {
      try {
        const link = await ensureActivepiecesUserForModelGrowUser({ supabase, user });
        ready += link.status === 'ready' ? 1 : 0;
        results.push({
          userId: user.id,
          email: user.email,
          status: link.status,
          activepiecesProjectId: link.activepieces_project_id,
        });
      } catch (error) {
        failed += 1;
        results.push({
          userId: user.id,
          email: user.email,
          status: 'failed',
          error: error.message || 'Unknown provisioning error',
        });
      }
    }

    return NextResponse.json({
      success: failed === 0,
      processed: candidates.length,
      ready,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Activepieces Backfill POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to backfill Activepieces users' }, { status: 500 });
  }
}
