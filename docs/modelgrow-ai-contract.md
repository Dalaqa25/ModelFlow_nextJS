# ModelGrow AI product contract

ModelGrow's conversational agent has two different kinds of context. They must
never be mixed.

## Stable product knowledge

The compact contract in `lib/ai/modelgrow-product-contract.js` explains:

- what ModelGrow is;
- the customer and developer journeys;
- what chat can and cannot do;
- the difference between marketplace listings and a user's runtime instances;
- the difference between enabled, running, succeeded, and failed;
- how ModelGrow should be described without leaking hidden engine brands.

This contract is loaded as a durable instruction for each Codex conversation.
Keep it concise because every new Codex session reads it.

## Live authoritative evidence

The model must not memorize or infer changing facts. These must come from
ModelGrow backend handlers:

| Fact | Authority |
| --- | --- |
| Available marketplace automations | `search_automations` |
| User's configured automations | `show_user_automations` |
| Selected automation requirements | setup backend state |
| Connected accounts | connection-check backend state |
| Missing and collected fields | setup backend state |
| Trigger receipt and execution results | runtime records |

If evidence is unavailable, the correct response is that ModelGrow cannot
verify the fact yet. The agent must not convert a plan, enabled state, or
expected trigger into a completed event.

## Updating behavior

When a repeated conversational failure appears:

1. Add the stable rule to the product contract only if it is universally true.
2. Add deterministic intent routing when the request has one unambiguous tool.
3. Add a regression test using the user's exact wording.
4. Keep changing data out of the prompt and fetch it from the backend.

This structure reduces hallucinations without sending the entire application
source code to Codex or increasing every turn's latency unnecessarily.
