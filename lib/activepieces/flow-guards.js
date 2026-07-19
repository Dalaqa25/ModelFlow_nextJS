export function getFlowDisplayName(flow) {
  return flow?.displayName || flow?.version?.displayName || flow?.name || 'Untitled flow';
}

export function isModelGrowRuntimeFlow(flow) {
  const displayName = getFlowDisplayName(flow);
  return Boolean(
    flow?.metadata?.modelgrowRuntime ||
    /^ModelGrow Runtime\s*-/i.test(displayName)
  );
}

export function isActivepiecesFlowPublished(flow) {
  return Boolean(flow?.publishedVersionId);
}

export function isActivepiecesFlowEnabled(flow) {
  return String(flow?.status || flow?.version?.status || '').toUpperCase() === 'ENABLED';
}

export function getSourceFlowBlockReason(flow) {
  if (!flow?.id) return 'not_found';
  if (isModelGrowRuntimeFlow(flow)) return 'runtime_copy';
  if (!isActivepiecesFlowPublished(flow)) return 'not_published';
  if (!isActivepiecesFlowEnabled(flow)) return 'not_enabled';
  return null;
}

export function getSourceFlowBlockMessage(reason) {
  switch (reason) {
    case 'runtime_copy':
      return 'ModelGrow runtime copies cannot be published back to ModelGrow. Open and publish the original builder flow instead.';
    case 'not_published':
      return 'Publish this workflow inside the ModelGrow Builder first, then publish it to ModelGrow.';
    case 'not_enabled':
      return 'Enable/publish this workflow inside the ModelGrow Builder first, then publish it to ModelGrow.';
    case 'not_found':
      return 'Flow not found in your builder workspace.';
    default:
      return '';
  }
}

export function isPublishableSourceFlow(flow) {
  return getSourceFlowBlockReason(flow) === null;
}
