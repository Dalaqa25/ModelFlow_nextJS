export const CONNECTOR_CREDENTIAL_DEFINITIONS = Object.freeze([
  {
    connectorId: 'google-sheets',
    displayName: 'Google Sheets',
    pieceName: '@activepieces/piece-google-sheets',
    nodeTypes: ['n8n-nodes-base.googleSheets'],
    credentialTypes: ['googleSheetsOAuth2Api', 'googleOAuth2Api'],
  },
  {
    connectorId: 'airtable',
    displayName: 'Airtable',
    pieceName: '@activepieces/piece-airtable',
    nodeTypes: ['n8n-nodes-base.airtable', 'n8n-nodes-base.airtableTool'],
    credentialTypes: ['airtableTokenApi', 'airtableOAuth2Api'],
  },
  {
    connectorId: 'clickup',
    displayName: 'ClickUp',
    pieceName: '@activepieces/piece-clickup',
    nodeTypes: ['n8n-nodes-base.clickUp'],
    credentialTypes: ['clickUpApi', 'clickUpOAuth2Api'],
  },
  {
    connectorId: 'google-calendar',
    displayName: 'Google Calendar',
    pieceName: '@activepieces/piece-google-calendar',
    nodeTypes: ['n8n-nodes-base.googleCalendar', 'n8n-nodes-base.googleCalendarTool'],
    credentialTypes: ['googleCalendarOAuth2Api'],
  },
  {
    connectorId: 'google-docs',
    displayName: 'Google Docs',
    pieceName: '@activepieces/piece-google-docs',
    nodeTypes: ['n8n-nodes-base.googleDocs', 'n8n-nodes-base.googleDocsTool'],
    credentialTypes: ['googleDocsOAuth2Api'],
  },
  {
    connectorId: 'google-drive',
    displayName: 'Google Drive',
    pieceName: '@activepieces/piece-google-drive',
    nodeTypes: ['n8n-nodes-base.googleDrive', 'n8n-nodes-base.googleDriveTrigger'],
    credentialTypes: ['googleDriveOAuth2Api', 'googleOAuth2Api'],
  },
  {
    connectorId: 'gmail',
    displayName: 'Gmail',
    pieceName: '@activepieces/piece-gmail',
    nodeTypes: ['n8n-nodes-base.gmail', 'n8n-nodes-base.gmailTool', 'n8n-nodes-base.gmailTrigger'],
    credentialTypes: ['gmailOAuth2', 'gmailOAuth2Api', 'googleOAuth2Api'],
  },
  {
    connectorId: 'slack',
    displayName: 'Slack',
    pieceName: '@activepieces/piece-slack',
    nodeTypes: ['n8n-nodes-base.slack'],
    credentialTypes: ['slackApi', 'slackOAuth2Api'],
  },
  {
    connectorId: 'linkedin',
    displayName: 'LinkedIn',
    pieceName: '@activepieces/piece-linkedin',
    nodeTypes: ['n8n-nodes-base.linkedIn'],
    credentialTypes: ['linkedInOAuth2Api'],
  },
  {
    connectorId: 'telegram',
    displayName: 'Telegram',
    pieceName: '@activepieces/piece-telegram-bot',
    nodeTypes: ['n8n-nodes-base.telegram', 'n8n-nodes-base.telegramTrigger'],
    credentialTypes: ['telegramApi'],
  },
  {
    connectorId: 'firecrawl',
    displayName: 'Firecrawl',
    pieceName: '@activepieces/piece-firecrawl',
    nodeTypes: ['@mendable/n8n-nodes-firecrawl.firecrawl'],
    credentialTypes: ['firecrawlApi'],
  },
]);

// Model/provider credentials belong to ModelGrow, not to the end user. The
// native runtime resolves these from its private environment, so they must
// never appear as an OAuth/API-key request in customer setup.
const PLATFORM_NODE_TYPES = new Set([
  '@n8n/n8n-nodes-langchain.lmChatGroq',
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  '@n8n/n8n-nodes-langchain.googleGemini',
  '@n8n/n8n-nodes-langchain.openAi',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatOpenRouter',
]);

const PLATFORM_CREDENTIAL_TYPES = new Set([
  'groqApi',
  'googlePalmApi',
  'openAiApi',
  'openRouterApi',
]);

function toKebabCase(value) {
  return String(value || '')
    .trim()
    .replace(/Trigger$|Tool$/i, '')
    .replace(/OAuth2Api$|OAuth2$|OAuthApi$|Api$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function inferConnectorCredentialDefinition(nodeType, credentialType) {
  if (!credentialType) return null;
  const nodeName = String(nodeType || '').trim().split('.').at(-1);
  const connectorId = toKebabCase(nodeName) || toKebabCase(credentialType);
  if (!connectorId) return null;
  const displayName = connectorId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return {
    connectorId,
    displayName,
    pieceName: `@activepieces/piece-${connectorId}`,
    nodeTypes: [String(nodeType || '').trim()].filter(Boolean),
    credentialTypes: [String(credentialType).trim()],
    inferred: true,
  };
}

export function findConnectorCredentialDefinition(nodeType, credentialType = null) {
  const explicit = CONNECTOR_CREDENTIAL_DEFINITIONS.find((definition) =>
    definition.nodeTypes.includes(String(nodeType || '').trim()) ||
    (credentialType && definition.credentialTypes.includes(String(credentialType).trim()))
  );
  if (explicit) return explicit;
  if (PLATFORM_NODE_TYPES.has(String(nodeType || '').trim()) ||
      PLATFORM_CREDENTIAL_TYPES.has(String(credentialType || '').trim())) {
    return null;
  }
  return inferConnectorCredentialDefinition(nodeType, credentialType);
}
