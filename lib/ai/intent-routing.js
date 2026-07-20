function normalizeIntentText(content) {
  return String(content || '')
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractCatalogAutomationSelection(content) {
  const text = String(content || '');
  const contextIndex = text.indexOf('[AVAILABLE AUTOMATIONS');
  if (contextIndex < 0) return null;

  const visibleRequest = normalizeIntentText(text.slice(0, contextIndex));
  if (!visibleRequest) return null;

  const entries = [];
  const entryPattern = /-\s*"([^"]+)"\s*\(UUID:\s*([a-f0-9-]{20,})\)/gi;
  let match;
  while ((match = entryPattern.exec(text.slice(contextIndex))) !== null) {
    entries.push({ automationName: match[1], automationId: match[2] });
  }
  if (entries.length === 0) return null;

  const exactName = entries.find(entry => normalizeIntentText(entry.automationName) === visibleRequest);
  if (exactName) return exactName;

  const explicitSelection = /\b(use|choose|select|pick|set up|setup)\b/.test(visibleRequest);
  if (explicitSelection) {
    const namedSelection = entries.find(entry => visibleRequest.includes(normalizeIntentText(entry.automationName)));
    if (namedSelection) return namedSelection;
  }

  const numericSelection = visibleRequest.match(/^(?:number\s+)?(\d+)$/);
  if (numericSelection) return entries[Number(numericSelection[1]) - 1] || null;

  const ordinalIndex = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
    .findIndex(ordinal => visibleRequest === ordinal || visibleRequest === `${ordinal} one`);
  return ordinalIndex >= 0 ? entries[ordinalIndex] || null : null;
}

export function isReadyToExecuteConfirmation(content) {
  // The browser appends private catalog/setup context to the latest user
  // message before sending it to the server. Only the visible portion is the
  // user's confirmation; matching the appended context makes a plain "run it"
  // look like a long unrelated request and hands it back to the orchestrator.
  const visibleContent = String(content || '').split(/\n\s*\[(?:AVAILABLE AUTOMATIONS|ACTIVE SETUP|CONFIG_FORM_SUBMITTED|READY_TO_RUN)\b/i)[0];
  const normalized = normalizeIntentText(visibleContent);
  if (!normalized) return false;

  // This helper is only used when the server already has an authoritative
  // READY_TO_RUN marker. Keep the accepted phrases deliberately narrow so a
  // request such as "run it tomorrow" can still be handled as scheduling.
  return /^(?:yes|yep|yeah|confirm|looks good|go ahead|do it|start|start it|run|run it|let's run it|lets run it)$/.test(normalized);
}

function previousAssistantMessage(messages) {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find(message => message?.role === 'assistant' && String(message?.content || '').trim());
}

export function extractAvailableAutomationDiscoveryRequest(content, messages = []) {
  const normalized = normalizeIntentText(content);
  if (!normalized) return null;

  // Ownership and runtime language belongs to the user's configured instances.
  if (/\b(my|mine|running|active|paused|status|enabled|disabled|installed)\b/.test(normalized)) {
    return null;
  }

  const mentionsAutomation = /\b(automation|automations|workflow|workflows)\b/.test(normalized);
  const expressesDiscovery = /\b(want|need|find|browse|explore|discover|recommend|suggest|options|looking for)\b/.test(normalized);
  const broadCatalogRequest =
    /\bwhat (?:automation|automations|workflow|workflows) do (?:you|modelgrow) have\b/.test(normalized) ||
    /\b(?:show|list) (?:me )?(?:the )?(?:available )?(?:automation|automations|workflow|workflows)\b/.test(normalized) ||
    /\b(?:available|existing) (?:automation|automations|workflow|workflows)\b/.test(normalized) ||
    /\bwhat can (?:you|modelgrow) automate\b/.test(normalized) ||
    /\b(?:automation|automations|workflow|workflows) (?:catalog|options)\b/.test(normalized) ||
    /\b(?:some|any) (?:automation|automations|workflow|workflows)\b/.test(normalized);

  if (broadCatalogRequest) return { browseAll: true, reason: 'explicit_catalog_request' };

  // A goal or named workflow should use the same deterministic catalog path,
  // but it must preserve the query so ranking can return the relevant result
  // instead of the first page of the entire catalog.
  if (mentionsAutomation && expressesDiscovery) {
    return { browseAll: false, reason: 'targeted_catalog_request' };
  }

  const acceptsOffer = /^(?:(?:ok(?:ay|ey)?|yes|yeah|yep|sure|please|alright)\s+)*(?:(?:show|list)(?:\s+me)?(?:\s+(?:them|those|the options))?|let me see(?: them)?|go ahead|do it)(?:\s+then)?$/.test(normalized);
  if (!acceptsOffer) return null;

  const previousAssistant = normalizeIntentText(previousAssistantMessage(messages)?.content);
  const catalogWasOffered =
    /\bavailable automations\b/.test(previousAssistant) ||
    /\bautomation options\b/.test(previousAssistant) ||
    /\bshow you\b.*\bautomations\b/.test(previousAssistant) ||
    /\bhelp you choose one\b/.test(previousAssistant);

  return catalogWasOffered
    ? { browseAll: true, reason: 'accepted_catalog_offer' }
    : null;
}
