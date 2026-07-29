const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'automat',
  'can',
  'do',
  'for',
  'help',
  'hello',
  'hey',
  'hi',
  'i',
  'is',
  'me',
  'my',
  'or',
  'please',
  'the',
  'to',
  'want',
  'with',
  'you',
]);

export function normalizeSearchToken(value) {
  const token = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!token) return '';

  // Match automate, automation, and automatically as one intent.
  if (token.startsWith('automat')) return 'automat';

  // Lightweight plural normalization is enough for catalog language without
  // introducing a heavy stemming dependency.
  if (token.length > 4 && token.endsWith('ies')) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.length > 4 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }

  return token;
}

function tokenizeSearchText(value) {
  return String(value || '')
    .split(/[^a-zA-Z0-9]+/)
    .map(normalizeSearchToken)
    .filter(Boolean);
}

export function extractSearchKeywords(query) {
  return [...new Set(
    tokenizeSearchText(query)
      .filter(token => token.length > 2 && !SEARCH_STOP_WORDS.has(token))
  )];
}

export function scoreAutomationSearch({ automation, connectors = [], keywords = [] }) {
  const nameTokens = new Set(tokenizeSearchText(automation?.name));
  const descriptionTokens = new Set(tokenizeSearchText(automation?.description));
  const connectorTokens = new Set(connectors.flatMap(tokenizeSearchText));

  const keywordMatches = keywords.filter(keyword =>
    nameTokens.has(keyword) || descriptionTokens.has(keyword)
  ).length;
  const connectorMatches = keywords.filter(keyword => connectorTokens.has(keyword)).length;
  const nameBonus = keywords.some(keyword => nameTokens.has(keyword)) ? 2 : 0;

  return keywordMatches + (connectorMatches * 2) + nameBonus;
}
