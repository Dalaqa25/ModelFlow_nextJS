function normalizeIntentText(content) {
  return String(content || '')
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PRIVATE_CONTEXT_MARKER_PATTERN =
  /(?:^|\n)\s*\[(?:AVAILABLE AUTOMATIONS|ACTIVE SETUP|CONFIG_FORM_SUBMITTED|READY_TO_RUN|READY_TO_EXECUTE|BACKGROUND_PROMPT|ACTIVEPIECES_CONNECTION_COMPLETED|Selected automation UUID|COLLECTED FIELDS|IMPORTANT|automation_id)\b/i;

export function extractVisibleUserContent(content) {
  const text = String(content || '');
  const marker = PRIVATE_CONTEXT_MARKER_PATTERN.exec(text);
  return (marker ? text.slice(0, marker.index) : text).trim();
}

function toCatalogSelection(entry) {
  if (!entry) return null;
  return {
    automationName: entry.automationName,
    automationId: entry.automationId,
  };
}

function extractCatalogAutomationContext(content) {
  const text = String(content || '');
  const contextIndex = text.lastIndexOf('[AVAILABLE AUTOMATIONS');
  if (contextIndex < 0) return null;

  const visibleRequest = normalizeIntentText(text.slice(0, contextIndex));
  if (!visibleRequest) return null;

  const rawEntries = [];
  const entryPattern = /-\s*"([^"]+)"\s*\(UUID:\s*([a-f0-9-]{20,})\)/gi;
  let match;
  while ((match = entryPattern.exec(text.slice(contextIndex))) !== null) {
    rawEntries.push({
      automationName: match[1],
      automationId: match[2],
      start: match.index,
    });
  }
  if (rawEntries.length === 0) return null;

  const contextText = text.slice(contextIndex);
  const entries = rawEntries.map((entry, index) => {
    const end = rawEntries[index + 1]?.start ?? contextText.length;
    const entryText = contextText.slice(entry.start, end);
    const description = entryText.match(/^\s*Description:\s*(.+)$/im)?.[1]?.trim();
    const requiresText = entryText.match(/^\s*Requires:\s*(.+)$/im)?.[1]?.trim();
    const requires = requiresText && !/^none$/i.test(requiresText)
      ? requiresText.split(',').map(value => value.trim()).filter(Boolean)
      : [];

    return {
      automationName: entry.automationName,
      automationId: entry.automationId,
      ...(description ? { description } : {}),
      ...(requiresText ? { requires } : {}),
    };
  });

  return {
    visibleRequest,
    entries,
    contextText,
  };
}

function extractCatalogMarker(content) {
  const text = String(content || '');
  const markerIndex = text.lastIndexOf('[AVAILABLE AUTOMATIONS');
  return markerIndex >= 0 ? text.slice(markerIndex) : null;
}

export function findLatestCatalogAutomationContext(messages) {
  for (const message of [...(Array.isArray(messages) ? messages : [])].reverse()) {
    const persistedAutomationContext = message?.metadata?.automationContext
      ? `[AVAILABLE AUTOMATIONS\n${message.metadata.automationContext}]`
      : '';
    const marker = extractCatalogMarker(
      `${message?.content || ''}\n${message?.metadata?.hiddenContext || ''}\n${persistedAutomationContext}`
    );
    if (marker) return marker.trimEnd();
  }
  return null;
}

function confirmsCatalogChoice(visibleRequest) {
  return /^(?:yes|yep|yeah|sure|ok|okay|okey|please|go ahead|do it|set it up|setup it|use it)$/.test(visibleRequest);
}

function hasCatalogSelectionIntent(visibleRequest) {
  return (
    /\b(?:use|user|choose|select|pick|take|want|setup|go with|go ahead)\b/.test(visibleRequest) ||
    /\bset\b.{0,40}\bup\b/.test(visibleRequest)
  );
}

export function extractCatalogAutomationSelection(content) {
  const context = extractCatalogAutomationContext(content);
  if (!context) return null;

  const { visibleRequest, entries } = context;
  const exactName = entries.find(entry => normalizeIntentText(entry.automationName) === visibleRequest);
  if (exactName) return toCatalogSelection(exactName);

  const explicitSelection = hasCatalogSelectionIntent(visibleRequest);
  if (explicitSelection) {
    const namedSelection = entries.find(entry => visibleRequest.includes(normalizeIntentText(entry.automationName)));
    if (namedSelection) return toCatalogSelection(namedSelection);
  }

  const numericSelection = visibleRequest.match(/^(?:number\s+)?(\d+)$/);
  if (numericSelection) return toCatalogSelection(entries[Number(numericSelection[1]) - 1]);

  const naturalNumericSelection =
    visibleRequest.match(/\b(?:option|number|choice)\s*(\d+)\b/) ||
    (explicitSelection ? visibleRequest.match(/\b(\d+)\b/) : null);
  if (naturalNumericSelection) {
    return toCatalogSelection(entries[Number(naturalNumericSelection[1]) - 1]);
  }

  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const ordinalIndex = ordinals.findIndex(ordinal => {
    const exactOrdinal =
      visibleRequest === ordinal ||
      visibleRequest === `${ordinal} one` ||
      visibleRequest === `the ${ordinal}` ||
      visibleRequest === `the ${ordinal} one`;
    const naturalOrdinal = explicitSelection && new RegExp(`\\b${ordinal}(?:\\s+one)?\\b`).test(visibleRequest);
    return exactOrdinal || naturalOrdinal;
  });
  if (ordinalIndex >= 0) return toCatalogSelection(entries[ordinalIndex]);

  // When exactly one catalog result was offered, a short confirmation can only
  // refer to that result. Resolve it here instead of letting the model turn
  // "Yes" into an unrelated catalog search.
  const confirmsOnlyResult =
    entries.length === 1 &&
    confirmsCatalogChoice(visibleRequest);

  return confirmsOnlyResult ? toCatalogSelection(entries[0]) : null;
}

export function extractAmbiguousCatalogConfirmation(content) {
  const context = extractCatalogAutomationContext(content);
  if (!context || context.entries.length < 2 || !confirmsCatalogChoice(context.visibleRequest)) {
    return null;
  }

  return context.entries.map(toCatalogSelection);
}

function referencesOfferedCatalog(content) {
  const visibleRequest = normalizeIntentText(
    String(content || '').split(/\n\s*\[AVAILABLE AUTOMATIONS\b/i)[0]
  );
  if (!visibleRequest) return false;
  if (confirmsCatalogChoice(visibleRequest)) return true;
  if (/^(?:number\s+)?\d+$/.test(visibleRequest)) return true;
  if (/\b(?:first|second|third|fourth|fifth|sixth)(?:\s+one)?\b/.test(visibleRequest)) return true;

  const selectionVerb = hasCatalogSelectionIntent(visibleRequest);
  const selectionObject = /\b(?:it|this|that|one|option|number|choice|\d+)\b/.test(visibleRequest);
  return selectionVerb && selectionObject;
}

function isCatalogQuestion(content) {
  const visibleRequest = normalizeIntentText(content);
  return (
    String(content || '').trim().endsWith('?') ||
    /^(?:tell|explain|describe|compare|what|how|why|which|does|do|can|is|are)\b/.test(visibleRequest)
  );
}

function findCatalogReference(content, context) {
  const visibleRequest = normalizeIntentText(content);
  if (!visibleRequest || !context?.entries?.length) return null;

  const fullNameMatch = context.entries.find(entry =>
    visibleRequest.includes(normalizeIntentText(entry.automationName))
  );
  if (fullNameMatch) return fullNameMatch;

  const numeric =
    visibleRequest.match(/^(?:number\s+)?(\d+)$/) ||
    visibleRequest.match(/\b(?:option|number|choice)\s*(\d+)\b/);
  if (numeric) return context.entries[Number(numeric[1]) - 1] || null;

  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const ordinalIndex = ordinals.findIndex(ordinal =>
    new RegExp(`\\b${ordinal}(?:\\s+one)?\\b`).test(visibleRequest)
  );
  if (ordinalIndex >= 0) return context.entries[ordinalIndex] || null;

  const ignored = new Set([
    'about', 'automation', 'automations', 'choose', 'describe', 'explain',
    'first', 'go', 'it', 'me', 'more', 'one', 'option', 'pick', 'please',
    'second', 'select', 'set', 'setup', 'tell', 'that', 'the', 'this',
    'use', 'user', 'want', 'with',
  ]);
  const referenceTokens = visibleRequest
    .split(/\s+/)
    .filter(token => token.length > 2 && !ignored.has(token));
  if (referenceTokens.length === 0) return null;

  const scored = context.entries.map((entry, index) => {
    const entryStart = context.contextText.indexOf(`- "${entry.automationName}"`);
    const nextEntry = context.entries[index + 1];
    const entryEnd = nextEntry
      ? context.contextText.indexOf(`- "${nextEntry.automationName}"`, entryStart + 1)
      : context.contextText.length;
    const entryText = normalizeIntentText(
      context.contextText.slice(entryStart, entryEnd >= 0 ? entryEnd : undefined)
    );
    return {
      entry,
      score: referenceTokens.filter(token => entryText.includes(token)).length,
    };
  }).sort((a, b) => b.score - a.score);

  if (scored[0]?.score > 0 && scored[0].score > (scored[1]?.score || 0)) {
    return scored[0].entry;
  }
  return null;
}

function findPreviousTurnCatalogFocus(messages, currentContent, context) {
  const userMessages = (Array.isArray(messages) ? messages : [])
    .filter(message => message?.role === 'user');
  if (userMessages.length === 0) return null;

  const currentVisible = normalizeIntentText(extractVisibleUserContent(currentContent));
  const latestUserVisible = normalizeIntentText(
    extractVisibleUserContent(userMessages.at(-1)?.visibleContent ?? userMessages.at(-1)?.content)
  );
  const previousUser = latestUserVisible === currentVisible
    ? userMessages.at(-2)
    : userMessages.at(-1);
  if (!previousUser) return null;

  const previousVisible = extractVisibleUserContent(
    previousUser.visibleContent ?? previousUser.content
  );
  if (!isCatalogQuestion(previousVisible)) return null;
  return findCatalogReference(previousVisible, context);
}

export function resolveCatalogTurn(content, messages = []) {
  const inlineMarker = extractCatalogMarker(content);
  const marker = inlineMarker || findLatestCatalogAutomationContext(messages);
  if (!marker) return { type: 'none', entries: [] };

  const visibleContent = inlineMarker
    ? String(content || '').slice(0, String(content || '').lastIndexOf('[AVAILABLE AUTOMATIONS'))
    : String(content || '');
  const selectionInput = `${visibleContent.trim()}\n\n${marker}`;
  const context = extractCatalogAutomationContext(selectionInput);
  if (!context) return { type: 'none', entries: [] };

  if (isCatalogQuestion(visibleContent)) {
    return {
      type: 'question',
      focus: findCatalogReference(visibleContent, context),
      entries: context.entries,
    };
  }

  const selection = extractCatalogAutomationSelection(selectionInput);
  if (selection) {
    return { type: 'selection', selection, entries: context.entries };
  }

  const explicitReferenceSelection =
    hasCatalogSelectionIntent(normalizeIntentText(visibleContent))
      ? findCatalogReference(visibleContent, context)
      : null;
  if (explicitReferenceSelection) {
    return {
      type: 'selection',
      selection: toCatalogSelection(explicitReferenceSelection),
      entries: context.entries,
    };
  }

  const normalizedVisibleContent = normalizeIntentText(visibleContent);
  const selectsByPronoun =
    hasCatalogSelectionIntent(normalizedVisibleContent) &&
    /\b(?:it|this|that|this one|that one)\b/.test(normalizedVisibleContent);
  if (selectsByPronoun) {
    const focusedEntry =
      findPreviousTurnCatalogFocus(messages, visibleContent, context) ||
      (context.entries.length === 1 ? context.entries[0] : null);
    if (focusedEntry) {
      return {
        type: 'selection',
        selection: toCatalogSelection(focusedEntry),
        entries: context.entries,
      };
    }
  }

  if (
    extractAmbiguousCatalogConfirmation(selectionInput) ||
    referencesOfferedCatalog(visibleContent)
  ) {
    return { type: 'clarification', entries: context.entries };
  }

  return { type: 'pending', entries: context.entries };
}

export function isReadyToExecuteConfirmation(content) {
  // The browser appends private catalog/setup context to the latest user
  // message before sending it to the server. Only the visible portion is the
  // user's confirmation; matching the appended context makes a plain "run it"
  // look like a long unrelated request and hands it back to the orchestrator.
  const visibleContent = extractVisibleUserContent(content);
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
  const normalized = normalizeIntentText(extractVisibleUserContent(content));
  if (!normalized) return null;

  const mentionsAutomation = /\b(automation|automations|workflow|workflows)\b/.test(normalized);
  const asksToInspect = /\b(show|list|check|view|what|which|status|tell)\b/.test(normalized);
  const mentionsOwnership = /\b(my|mine|i have|i've got)\b/.test(normalized);
  const mentionsRunState = /\b(running|active|paused|status|enabled|disabled|inactive|installed|already set up|configured)\b/.test(normalized);

  // Only explicit instance/status language belongs to the user's configured
  // automations. Possessives for connected resources ("my Gmail", "my
  // spreadsheet") are still normal catalog-discovery requests.
  if (
    mentionsRunState ||
    (mentionsAutomation && mentionsOwnership && asksToInspect)
  ) {
    return null;
  }

  const expressesDiscovery = /\b(want|need|find|browse|explore|discover|recommend|suggest|options|looking for)\b/.test(normalized);
  const describesAutomatedOutcome =
    /\bautomat(?:e|ed|es|ing|ically)\b/.test(normalized) ||
    /\b(?:whenever|every time|every new)\b/.test(normalized);
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
  if ((mentionsAutomation && expressesDiscovery) || describesAutomatedOutcome) {
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
