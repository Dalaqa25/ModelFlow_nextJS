export const GMAIL_OAUTH_SCOPES = Object.freeze({
  full: 'https://mail.google.com/',
  readonly: 'https://www.googleapis.com/auth/gmail.readonly',
  modify: 'https://www.googleapis.com/auth/gmail.modify',
  compose: 'https://www.googleapis.com/auth/gmail.compose',
  send: 'https://www.googleapis.com/auth/gmail.send',
});

const GMAIL_READ_OPERATIONS = new Set(['get', 'getAll', 'getMany', 'search']);
const GMAIL_MODIFY_OPERATIONS = new Set([
  'addLabels',
  'markAsRead',
  'markAsUnread',
  'removeLabels',
  'trash',
  'untrash',
]);
const GMAIL_SEND_OPERATIONS = new Set(['reply', 'send', 'sendAndWait']);

function gmailResource(node) {
  return String(node?.parameters?.resource || 'message').trim();
}

function gmailOperation(node) {
  const configured = String(node?.parameters?.operation || '').trim();
  if (configured) return configured;

  switch (gmailResource(node)) {
    case 'draft':
      return 'create';
    case 'label':
      return 'getAll';
    case 'thread':
      return 'getAll';
    default:
      return 'send';
  }
}

export function requiredGmailOAuthScopes(node) {
  if (node?.type === 'n8n-nodes-base.gmailTrigger') {
    return [GMAIL_OAUTH_SCOPES.readonly];
  }
  if (!['n8n-nodes-base.gmail', 'n8n-nodes-base.gmailTool'].includes(node?.type)) {
    return [];
  }

  const resource = gmailResource(node);
  const operation = gmailOperation(node);

  if (operation === 'delete') {
    if (resource === 'message' || resource === 'thread') {
      return [GMAIL_OAUTH_SCOPES.full];
    }
    return resource === 'draft'
      ? [GMAIL_OAUTH_SCOPES.compose]
      : [GMAIL_OAUTH_SCOPES.modify];
  }
  if (resource === 'draft' && operation === 'create') {
    return [GMAIL_OAUTH_SCOPES.compose];
  }
  if (GMAIL_READ_OPERATIONS.has(operation)) {
    return [GMAIL_OAUTH_SCOPES.readonly];
  }
  if (GMAIL_MODIFY_OPERATIONS.has(operation)) {
    return [GMAIL_OAUTH_SCOPES.modify];
  }
  if (GMAIL_SEND_OPERATIONS.has(operation)) {
    return [GMAIL_OAUTH_SCOPES.send];
  }

  return [];
}

export function requiredOAuthScopesForImportedRequirement(workflow, requirement) {
  if (requirement?.connectorId !== 'gmail' || !Array.isArray(workflow?.nodes)) {
    return [];
  }

  const includedNodeNames = new Set(requirement.nodeNames || []);
  const scopes = new Set();
  for (const node of workflow.nodes) {
    if (!includedNodeNames.has(node.name)) continue;
    for (const scope of requiredGmailOAuthScopes(node)) scopes.add(scope);
  }
  return Array.from(scopes);
}

export function mergeOAuthScopes(baseScopes = [], requiredScopes = []) {
  return Array.from(new Set(
    [...baseScopes, ...requiredScopes]
      .map((scope) => String(scope || '').trim())
      .filter(Boolean),
  ));
}

export function ensureOAuthAuthorizationUrlScopes(authorizationUrl, requiredScopes = []) {
  const url = new URL(authorizationUrl);
  const currentScopes = String(url.searchParams.get('scope') || '')
    .split(/\s+/)
    .filter(Boolean);
  const mergedScopes = mergeOAuthScopes(currentScopes, requiredScopes);

  if (mergedScopes.length) {
    url.searchParams.set('scope', mergedScopes.join(' '));
  }

  return url.toString();
}
