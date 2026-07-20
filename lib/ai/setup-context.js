function parseJsonObjectAt(content, objectStart) {
  if (content[objectStart] !== '{') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = objectStart; index < content.length; index += 1) {
    const character = content[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(content.slice(objectStart, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function findLatestSetupMarker(content, markerName) {
  const marker = String(markerName || '').replace(/[^A-Z_]/gi, '');
  if (!marker) return null;

  const regex = new RegExp(`\\[${marker}\\s+automation_id="([^"]+)"\\s+config=`, 'g');
  let latest = null;
  let match;
  while ((match = regex.exec(String(content || ''))) !== null) {
    let objectStart = regex.lastIndex;
    while (/\s/.test(content[objectStart] || '')) objectStart += 1;
    const config = parseJsonObjectAt(content, objectStart);
    if (config) {
      latest = {
        automationId: match[1],
        config,
        index: match.index,
      };
    }
  }
  return latest;
}
