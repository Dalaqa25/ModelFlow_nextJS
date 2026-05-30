import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { supabase } from '@/lib/db/supabase-db';
import { adminBroadcastEmail } from '@/lib/email/templates';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];
const MAX_SUBJECT = 140;
const MAX_MESSAGE = 8000;
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || 'ModelGrow <notifications@send.modelgrow.com>';
const REQUEST_DELAY_MS = 250; // 4 requests/sec to stay below 5 req/sec rate limit

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

async function getUniqueUserEmails() {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .not('email', 'is', null);

  if (error) throw error;

  const unique = new Set();
  for (const row of data || []) {
    const email = row?.email?.trim()?.toLowerCase();
    if (email) unique.add(email);
  }
  return Array.from(unique);
}

export async function GET() {
  try {
    const user = await getSupabaseUser();
    if (!isAdminEmail(user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emails = await getUniqueUserEmails();
    return NextResponse.json({ recipientCount: emails.length });
  } catch (error) {
    console.error('[Admin Broadcast GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    if (!isAdminEmail(user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const subject = (body?.subject || '').trim();
    const message = (body?.message || '').trim();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    if (subject.length > MAX_SUBJECT) {
      return NextResponse.json({ error: `Subject too long (max ${MAX_SUBJECT})` }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `Message too long (max ${MAX_MESSAGE})` }, { status: 400 });
    }

    const recipientEmails = await getUniqueUserEmails();
    if (recipientEmails.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        message: 'No users found with email addresses.',
      });
    }

    const template = adminBroadcastEmail({ title: subject, message });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    let sent = 0;
    let failed = 0;
    const failureReasons = {};

    for (const to of recipientEmails) {
      try {
        const { error } = await resend.emails.send({
          from: FROM_ADDRESS,
          to,
          subject: template.subject,
          html: template.html,
        });
        if (error) {
          throw new Error(error.message || 'Resend rejected request');
        }
        sent += 1;
      } catch (sendError) {
        failed += 1;
        const reason = sendError?.message || 'Unknown send failure';
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    const success = sent > 0;
    return NextResponse.json({
      success,
      sent,
      failed,
      total: recipientEmails.length,
      from: FROM_ADDRESS,
      failureReasons: Object.entries(failureReasons)
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => ({ reason, count })),
    });
  } catch (error) {
    console.error('[Admin Broadcast POST] Error:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}
