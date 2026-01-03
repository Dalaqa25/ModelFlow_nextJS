import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const automationId = searchParams.get('automation_id');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's automation IDs
    const { data: userAutomations } = await supabase
      .from('automations')
      .select('id')
      .eq('author_email', user.email);

    const automationIds = userAutomations?.map(a => a.id) || [];

    if (automationIds.length === 0) {
      return NextResponse.json({
        dailyRuns: [],
        totalRuns: 0,
        totalEarnings: 0,
        successRate: 0
      });
    }

    // Build query for executions
    let query = supabase
      .from('automation_executions')
      .select('*')
      .in('automation_id', automationIds)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    // Filter by specific automation if provided
    if (automationId) {
      query = query.eq('automation_id', automationId);
    }

    const { data: executions, error } = await query;

    if (error) throw error;

    // Group by day
    const dailyStats = {};
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = { date: dateKey, runs: 0, earnings: 0, success: 0, failed: 0 };
    }

    let totalEarnings = 0;
    let successCount = 0;

    (executions || []).forEach(exec => {
      const dateKey = exec.completed_at?.split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].runs += 1;
        dailyStats[dateKey].earnings += parseFloat(exec.credits_used || 0);
        if (exec.status === 'success') {
          dailyStats[dateKey].success += 1;
          successCount += 1;
        } else {
          dailyStats[dateKey].failed += 1;
        }
      }
      totalEarnings += parseFloat(exec.credits_used || 0);
    });

    const dailyRuns = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    const totalRuns = executions?.length || 0;
    const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;

    return NextResponse.json({
      dailyRuns,
      totalRuns,
      totalEarnings,
      successRate
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
