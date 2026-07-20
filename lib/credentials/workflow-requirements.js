import crypto from 'crypto';
import { findConnectorCredentialDefinition } from './connector-registry.js';

function referenceFor(credentialType, config = {}) {
  return `${credentialType}:${String(config.id || config.name || 'default').trim()}`;
}

function referencesDeveloperKey(credentialConfig, developerKeyNames = []) {
  const names = new Set(
    developerKeyNames
      .map((name) => String(name || '').trim())
      .filter(Boolean)
  );
  if (names.size === 0) return false;

  let serialized = '';
  try {
    serialized = typeof credentialConfig === 'string'
      ? credentialConfig
      : JSON.stringify(credentialConfig || {});
  } catch {
    serialized = String(credentialConfig || '');
  }

  return Array.from(names).some((name) => (
    serialized.includes(`{{${name}}}`) ||
    serialized === name ||
    serialized.includes(`\"${name}\"`)
  ));
}

export function detectImportedWorkflowCredentialRequirements(
  workflow,
  { developerKeyNames = [] } = {}
) {
  if (!Array.isArray(workflow?.nodes)) return [];
  const requirements = new Map();

  for (const node of workflow.nodes) {
    const entries = node.credentials && typeof node.credentials === 'object'
      ? Object.entries(node.credentials)
      : [[null, {}]];

    for (const [credentialType, credentialConfig] of entries) {
      if (referencesDeveloperKey(credentialConfig, developerKeyNames)) continue;
      const definition = findConnectorCredentialDefinition(node.type, credentialType);
      if (!definition) continue;
      const effectiveType = credentialType || definition.credentialTypes[0];
      const credentialReference = referenceFor(effectiveType, credentialConfig);
      const credentialKey = crypto.createHash('sha256')
        .update(`${definition.pieceName}:${credentialReference}`)
        .digest('hex')
        .slice(0, 24);
      const dedupeKey = `${definition.pieceName}:${credentialKey}`;
      const existing = requirements.get(dedupeKey);
      if (existing) {
        existing.nodeNames.push(node.name);
        continue;
      }
      requirements.set(dedupeKey, {
        credentialKey,
        credentialType: effectiveType,
        connectorId: definition.connectorId,
        pieceName: definition.pieceName,
        displayName: definition.displayName,
        inferred: Boolean(definition.inferred),
        credentialReference,
        nodeNames: [node.name],
      });
    }
  }
  return Array.from(requirements.values());
}
