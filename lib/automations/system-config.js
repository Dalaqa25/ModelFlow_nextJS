// `automations.system_config` holds the storage buckets an automation
// provisions for itself — an array of { name, bucket, mimeType } descriptors
// that callers iterate to find where uploads belong.
//
// Every consumer used to normalize it inline with `automation.system_config
// || []`, which covers null but not a value of the wrong shape. A JSONB column
// accepts any JSON, and an automation imported with an object in this column
// crashed setup with "systemConfig is not iterable" — past the `|| []` guard,
// since an object is truthy. The column is written by hand often enough
// (imports, admin tooling, migrations) that the shape cannot be assumed from
// the schema alone, so it is checked once here instead of eight times badly.
//
// A wrong-shaped value yields an empty list rather than throwing: it means
// this automation declares no buckets, which is the same position as the
// majority that declare none. Automations that genuinely need storage have
// their descriptors and still get them.
export function parseSystemConfig(value) {
  if (Array.isArray(value)) return value.filter(entry => entry && typeof entry === 'object');

  // A JSON string round-tripped through a text column still deserves parsing.
  if (typeof value === 'string' && value.trim()) {
    try {
      return parseSystemConfig(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}
