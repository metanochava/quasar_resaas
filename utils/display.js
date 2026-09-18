// The backend serializes choice/relation fields as {id, value, label}
// (BaseSerializer). A view must never print that object: prefer the
// human label, then the value, and only as a last resort the id.
export function displayValue(v) {
  if (v === null || v === undefined) return ''
  if (typeof v !== 'object') return String(v)
  const out = v.label ?? v.value ?? v.id
  return out === null || out === undefined ? '' : String(out)
}

// The stored/machine value of such a field (for icon/colour lookups).
export function rawValue(v) {
  if (v === null || v === undefined) return ''
  return typeof v === 'object' ? String(v.value ?? v.id ?? '') : String(v)
}
