function normalizeIntentText(content) {
  return String(content || '')
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const explicitCatalogRequest =
    /\bwhat (?:automation|automations|workflow|workflows) do (?:you|modelgrow) have\b/.test(normalized) ||
    /\b(?:show|list) (?:me )?(?:the )?(?:available )?(?:automation|automations|workflow|workflows)\b/.test(normalized) ||
    /\b(?:available|existing) (?:automation|automations|workflow|workflows)\b/.test(normalized) ||
    /\bwhat can (?:you|modelgrow) automate\b/.test(normalized) ||
    /\bautomation (?:catalog|options)\b/.test(normalized) ||
    (mentionsAutomation && expressesDiscovery);

  if (explicitCatalogRequest) return { browseAll: true, reason: 'explicit_catalog_request' };

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
