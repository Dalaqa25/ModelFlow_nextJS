const TOKEN_TO_USD = 0.10;

export async function recordSuccessfulAutomationUsage({
  supabase,
  user,
  automation,
  tokenCost,
  engine,
  executionId,
}) {
  if (!tokenCost || tokenCost <= 0) {
    return {
      tokensRemaining: null,
      charged: false,
      creatorCredited: false,
    };
  }
  if (!executionId || !String(executionId).trim()) {
    throw new Error('A successful engine execution ID is required before charging tokens');
  }

  const { data, error } = await supabase.rpc('record_successful_automation_usage', {
    p_user_id: user.id,
    p_automation_id: automation.id,
    p_automation_name: automation.name,
    p_developer_email: automation.author_email || null,
    p_engine: engine,
    p_execution_id: String(executionId),
    p_token_cost: tokenCost,
    p_usd_per_token: TOKEN_TO_USD,
  });
  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || !Number.isFinite(Number(result.tokens_remaining))) {
    throw new Error('Atomic automation usage billing returned no token balance');
  }
  return {
    tokensRemaining: Number(result.tokens_remaining),
    charged: result.charged === true,
    creatorCredited: result.creator_credited === true,
  };
}
