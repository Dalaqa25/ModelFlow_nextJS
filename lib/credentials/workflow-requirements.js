import crypto from 'crypto';
import { findConnectorCredentialDefinition } from './connector-registry.js';

function referenceFor(credentialType, config = {}) {
  return `${credentialType}:${String(config.id || config.name || 'default').trim()}`;
}

export function detectImportedWorkflowCredentialRequirements(workflow) {
  if (!Array.isArray(workflow?.nodes)) return [];
  const requirements = new Map();

  for (const node of workflow.nodes) {
    const entries = node.credentials && typeof node.credentials === 'object'
      ? Object.entries(node.credentials)
      : [[null, {}]];

    for (const [credentialType, credentialConfig] of entries) {
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
        nodeNames: [node.name],
      });
    }
  }
  return Array.from(requirements.values());
}
