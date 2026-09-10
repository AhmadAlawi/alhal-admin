/**
 * Deep camel-case object keys coming back from the API.
 *
 * The .NET backend serializes responses in PascalCase (UserId, NameAr,
 * IsActive, ...) while the admin pages are written against camelCase. Running
 * every response through this once, in the API client, keeps the two in sync
 * without every page needing its own dual-casing normalizer.
 *
 * Only the first character of a PascalCase key is lowered (UserId -> userId).
 * Keys that are already camelCase / lowercase pass through untouched, and if
 * both casings are present on the same object the original key is kept so no
 * data is lost. Values (including enum strings and dates) are never modified.
 */
export function camelizeKeysDeep(value) {
  if (Array.isArray(value)) return value.map(camelizeKeysDeep);
  if (value && typeof value === 'object') {
    // Leave non-plain objects (Date, etc.) alone.
    if (value.constructor && value.constructor !== Object) return value;
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      const camel = /^[A-Z]/.test(key)
        ? key.charAt(0).toLowerCase() + key.slice(1)
        : key;
      const target = camel !== key && camel in value ? key : camel;
      out[target] = camelizeKeysDeep(val);
    }
    return out;
  }
  return value;
}

export default camelizeKeysDeep;
