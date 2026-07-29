import assert from 'node:assert/strict';
import test from 'node:test';
import { recordSuccessfulAutomationUsage } from './automation-usage.js';

const user = { id: '11111111-1111-1111-1111-111111111111' };
const automation = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Invoice organizer',
  author_email: 'builder@example.test',
};

test('free executions do not call the billing RPC', async () => {
  let called = false;
  const result = await recordSuccessfulAutomationUsage({
    supabase: { rpc: async () => { called = true; } },
    user,
    automation,
    tokenCost: 0,
    engine: 'n8n-native',
    executionId: 'execution-1',
  });
  assert.equal(called, false);
  assert.deepEqual(result, {
    tokensRemaining: null,
    charged: false,
    creatorCredited: false,
  });
});

test('paid executions fail closed without a successful engine execution ID', async () => {
  await assert.rejects(
    () => recordSuccessfulAutomationUsage({
      supabase: { rpc: async () => ({ data: null, error: null }) },
      user,
      automation,
      tokenCost: 2,
      engine: 'activepieces',
      executionId: null,
    }),
    /execution ID is required/i,
  );
});

test('paid executions use the atomic idempotent billing RPC', async () => {
  let call;
  const result = await recordSuccessfulAutomationUsage({
    supabase: {
      rpc: async (name, parameters) => {
        call = { name, parameters };
        return {
          data: [{
            tokens_remaining: 18,
            charged: true,
            creator_credited: true,
          }],
          error: null,
        };
      },
    },
    user,
    automation,
    tokenCost: 2,
    engine: 'n8n-native',
    executionId: 'execution-1',
  });
  assert.equal(call.name, 'record_successful_automation_usage');
  assert.equal(call.parameters.p_execution_id, 'execution-1');
  assert.equal(call.parameters.p_token_cost, 2);
  assert.equal(call.parameters.p_usd_per_token, 0.10);
  assert.deepEqual(result, {
    tokensRemaining: 18,
    charged: true,
    creatorCredited: true,
  });
});

test('a duplicate execution reports no second charge', async () => {
  const result = await recordSuccessfulAutomationUsage({
    supabase: {
      rpc: async () => ({
        data: [{
          tokens_remaining: 18,
          charged: false,
          creator_credited: false,
        }],
        error: null,
      }),
    },
    user,
    automation,
    tokenCost: 2,
    engine: 'activepieces',
    executionId: 'same-execution',
  });
  assert.equal(result.tokensRemaining, 18);
  assert.equal(result.charged, false);
  assert.equal(result.creatorCredited, false);
});
