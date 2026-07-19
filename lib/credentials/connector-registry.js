export const CONNECTOR_CREDENTIAL_DEFINITIONS = Object.freeze([
  {
    connectorId: 'google-sheets',
    displayName: 'Google Sheets',
    pieceName: '@activepieces/piece-google-sheets',
    nodeTypes: ['n8n-nodes-base.googleSheets'],
    credentialTypes: ['googleSheetsOAuth2Api', 'googleOAuth2Api'],
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
]);

export function findConnectorCredentialDefinition(nodeType, credentialType = null) {
  return CONNECTOR_CREDENTIAL_DEFINITIONS.find((definition) =>
    definition.nodeTypes.includes(String(nodeType || '').trim()) ||
    (credentialType && definition.credentialTypes.includes(String(credentialType).trim()))
  ) || null;
}
