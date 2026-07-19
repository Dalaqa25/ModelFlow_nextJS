import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = await import('../lib/activepieces/client.js');

const args = process.argv.slice(2);
const DEMO_NAME = args.find((arg) => !arg.startsWith('--')) || 'Complex Demo - Multi Connector Intake';
const STEP_LIMIT_ARG = args.find((arg) => arg.startsWith('--steps='));
const STEP_LIMIT = STEP_LIMIT_ARG ? Number(STEP_LIMIT_ARG.split('=')[1]) : null;
const DUMP_ONLY = args.includes('--dump-only');

const ACTION_SPECS = [
  {
    stepName: 'step_google_sheets',
    displayName: 'Add Lead To Google Sheet',
    pieceName: '@activepieces/piece-google-sheets',
    actionName: 'insert_row',
    defaults: {
      includeTeamDrives: false,
      first_row_headers: false,
      as_string: false,
    },
  },
  {
    stepName: 'step_slack',
    displayName: 'Send Slack Alert',
    pieceName: '@activepieces/piece-slack',
    actionName: 'send_channel_message',
    defaults: {
      sendAsBot: true,
      replyBroadcast: false,
      mentionOriginFlow: false,
      unfurlLinks: true,
      blocks: [],
    },
  },
  {
    stepName: 'step_gmail',
    displayName: 'Send Gmail Followup',
    pieceName: '@activepieces/piece-gmail',
    actionName: 'send_email',
    defaults: {
      receiver: [],
      cc: [],
      bcc: [],
      body_type: 'plain_text',
      reply_to: [],
      attachments: [],
      draft: true,
    },
  },
  {
    stepName: 'step_notion',
    displayName: 'Create Notion Page',
    pieceName: '@activepieces/piece-notion',
    actionName: 'createPage',
    defaults: {},
  },
  {
    stepName: 'step_calendar',
    displayName: 'Create Calendar Event',
    pieceName: '@activepieces/piece-google-calendar',
    actionName: 'create_google_calendar_event',
    defaults: {
      guests_can_modify: false,
      guests_can_invite_others: false,
      guests_can_see_other_guests: false,
      send_notifications: 'all',
      create_meet_link: false,
      attendees: [],
    },
  },
];

const SELECTED_ACTION_SPECS = Number.isFinite(STEP_LIMIT) && STEP_LIMIT > 0
  ? ACTION_SPECS.slice(0, STEP_LIMIT)
  : ACTION_SPECS;

function getEmptyValueForProp(prop) {
  const type = String(prop?.type || '').toUpperCase();
  if (Object.prototype.hasOwnProperty.call(prop || {}, 'defaultValue') && prop.defaultValue !== undefined && prop.defaultValue !== null) {
    return prop.defaultValue;
  }
  if (type.includes('DYNAMIC')) return {};
  if (type.includes('JSON')) return [];
  if (type.includes('ARRAY')) return [];
  if (type.includes('CHECKBOX')) return false;
  return null;
}

function buildPropertySettings(props, defaults) {
  return Object.fromEntries(
    Object.entries(props || {})
      .filter(([key, prop]) => shouldIncludeProp(prop, key, defaults))
      .map(([key, prop]) => [
        key,
        String(prop?.type || '').toUpperCase().includes('DYNAMIC')
          ? { type: 'MANUAL', schema: {} }
          : { type: 'MANUAL' },
      ])
  );
}

function shouldIncludeProp(prop, key, defaults) {
  if (Object.prototype.hasOwnProperty.call(defaults, key)) return true;

  const type = String(prop?.type || '').toUpperCase();
  if (type.includes('MARKDOWN')) return false;

  if (prop?.required) return true;
  if (Object.prototype.hasOwnProperty.call(prop || {}, 'defaultValue') && prop.defaultValue !== undefined && prop.defaultValue !== null) {
    return true;
  }

  return false;
}

function buildInput(props, defaults) {
  const input = {};
  for (const [key, prop] of Object.entries(props || {})) {
    if (!shouldIncludeProp(prop, key, defaults)) continue;

    input[key] = Object.prototype.hasOwnProperty.call(defaults, key)
      ? defaults[key]
      : getEmptyValueForProp(prop);
  }

  return input;
}

function buildStep({ stepName, displayName, pieceName, actionName, pieceVersion, props, defaults, nextAction = null }) {
  return {
    name: stepName,
    skip: false,
    type: 'PIECE',
    valid: false,
    settings: {
      input: buildInput(props, defaults),
      pieceName,
      actionName,
      pieceVersion,
      propertySettings: buildPropertySettings(props, defaults),
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
    displayName,
    lastUpdatedDate: new Date().toISOString(),
    ...(nextAction ? { nextAction } : {}),
  };
}

function buildEmptyTrigger(nextAction) {
  return {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    nextAction,
    lastUpdatedDate: new Date().toISOString(),
    type: 'EMPTY',
    settings: {},
  };
}

async function main() {
  const admin = await client.adminSignIn();
  const projectId = admin.projectId;

  const actionDefinitions = [];
  for (const spec of SELECTED_ACTION_SPECS) {
    const meta = await client.getPieceMetadata({
      token: admin.token,
      pieceName: spec.pieceName,
      projectId,
    });
    const action = meta?.actions?.[spec.actionName];
    if (!action) {
      throw new Error(`Action ${spec.actionName} not found for ${spec.pieceName}`);
    }
    actionDefinitions.push({
      ...spec,
      pieceVersion: meta.version,
      props: action.props || {},
    });
  }

  let nextAction = null;
  for (let index = actionDefinitions.length - 1; index >= 0; index -= 1) {
    nextAction = buildStep({
      ...actionDefinitions[index],
      nextAction,
    });
  }

  const trigger = buildEmptyTrigger(nextAction);

  if (DUMP_ONLY) {
    console.log(JSON.stringify({ displayName: DEMO_NAME, trigger }, null, 2));
    return;
  }

  const flow = await client.createFlow({
    token: admin.token,
    projectId,
    displayName: DEMO_NAME,
    metadata: {
      modelgrowDemo: true,
      generatedAt: new Date().toISOString(),
      generatedBy: 'scripts/create-activepieces-demo-flow.mjs',
    },
  });

  await client.importFlowTemplate({
    token: admin.token,
    flowId: flow.id,
    projectId,
    displayName: DEMO_NAME,
    trigger,
    schemaVersion: '20',
    notes: [
      'Complex demo flow generated for ModelGrow validation.',
      'This flow is intentionally left partially unconfigured so ModelGrow can detect required connectors and setup inputs.',
    ],
  });

  const result = {
    projectId,
    flowId: flow.id,
    displayName: DEMO_NAME,
    connectors: ACTION_SPECS.map((spec) => spec.pieceName),
    actions: SELECTED_ACTION_SPECS.map((spec) => ({
      pieceName: spec.pieceName,
      actionName: spec.actionName,
      displayName: spec.displayName,
    })),
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
