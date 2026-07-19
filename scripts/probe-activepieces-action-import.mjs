import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = await import('../lib/activepieces/client.js');

const [, , pieceSlugArg, versionArg] = process.argv;

const SPECS = {
  'google-sheets': {
    pieceName: '@activepieces/piece-google-sheets',
    actionName: 'insert_row',
    displayName: 'Add Row',
    defaults: {
      includeTeamDrives: false,
      first_row_headers: false,
      as_string: false,
    },
  },
  slack: {
    pieceName: '@activepieces/piece-slack',
    actionName: 'send_channel_message',
    displayName: 'Send Channel Message',
    defaults: {
      sendAsBot: true,
      replyBroadcast: false,
      mentionOriginFlow: false,
      unfurlLinks: true,
      blocks: [],
    },
  },
  gmail: {
    pieceName: '@activepieces/piece-gmail',
    actionName: 'send_email',
    displayName: 'Send Email',
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
  notion: {
    pieceName: '@activepieces/piece-notion',
    actionName: 'createPage',
    displayName: 'Create Page',
    defaults: {},
  },
  'google-calendar': {
    pieceName: '@activepieces/piece-google-calendar',
    actionName: 'create_google_calendar_event',
    displayName: 'Create Event',
    defaults: {
      guests_can_modify: false,
      guests_can_invite_others: false,
      guests_can_see_other_guests: false,
      send_notifications: 'all',
      create_meet_link: false,
      attendees: [],
    },
  },
};

const spec = SPECS[pieceSlugArg];
if (!spec || !versionArg) {
  console.error('Usage: node scripts/probe-activepieces-action-import.mjs <google-sheets|slack|gmail|notion|google-calendar> <pieceVersion>');
  process.exit(1);
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

const admin = await client.adminSignIn();
const meta = await client.getPieceMetadata({
  token: admin.token,
  projectId: admin.projectId,
  pieceName: spec.pieceName,
});
const action = meta.actions?.[spec.actionName];
if (!action) {
  throw new Error(`Action ${spec.actionName} not found`);
}

const trigger = {
  name: 'trigger',
  valid: false,
  displayName: 'Select Trigger',
  type: 'EMPTY',
  settings: {},
  lastUpdatedDate: new Date().toISOString(),
  nextAction: {
    name: 'step_1',
    skip: false,
    type: 'PIECE',
    valid: false,
    displayName: spec.displayName,
    lastUpdatedDate: new Date().toISOString(),
    settings: {
      input: buildInput(action.props || {}, spec.defaults),
      pieceName: spec.pieceName,
      actionName: spec.actionName,
      pieceVersion: versionArg,
      propertySettings: buildPropertySettings(action.props || {}, spec.defaults),
      errorHandlingOptions: {
        retryOnFailure: { value: false },
        continueOnFailure: { value: false },
      },
    },
  },
};

const flow = await client.createFlow({
  token: admin.token,
  projectId: admin.projectId,
  displayName: `Probe ${pieceSlugArg} ${versionArg}`,
  metadata: { probe: true, pieceSlug: pieceSlugArg, pieceVersion: versionArg },
});

try {
  await client.importFlowTemplate({
    token: admin.token,
    flowId: flow.id,
    projectId: admin.projectId,
    displayName: `Probe ${pieceSlugArg} ${versionArg}`,
    trigger,
    schemaVersion: '20',
    notes: [],
  });

  console.log(JSON.stringify({ ok: true, flowId: flow.id, piece: pieceSlugArg, version: versionArg }, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    flowId: flow.id,
    piece: pieceSlugArg,
    version: versionArg,
    error: error.message,
    details: error.data || null,
  }, null, 2));
  process.exit(1);
}
