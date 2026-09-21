// The RESAAS error / alert contract, read on the client (pure functions, no Quasar).
//
//   error   {"error": {"code"?, "message", "details"}}          the failure of the request
//   alerts  {"alerts": [{"level", "message", "code"?, "details"}]}   extra messages
//
// HTTP status stays the authority (error.response.status): it is never read from the
// body. `code` is stable and never translated - branch on it, never on `message`.
//
// Older answers are still understood, so nothing else has to change at once:
//   {"detail": "...", "code": "..."}        -> DEPRECATED alias of `error`
//   {"field": ["msg"]}                      -> DEPRECATED bare validation map
//   {"alert_success" | "alert_info" | "alert_warning" | "alert_error": "..."}

export const LEVELS = ['success', 'info', 'warning', 'error']

// backend level -> Quasar Notify type. The backend never sees these names.
const QUASAR_TYPE = { success: 'positive', info: 'info', warning: 'warning', error: 'negative' }

export const levelToQuasar = (level) => QUASAR_TYPE[level] || 'info'

export const normalizeLevel = (level) => (LEVELS.includes(level) ? level : 'info')

const RESERVED_KEYS = new Set([
  'detail', 'code', 'error', 'alerts',
  'alert_error', 'alert_success', 'alert_info', 'alert_warning'
])

// One readable string out of a string / array / nested object of messages.
export function extractMessage(value) {
  if (Array.isArray(value)) return value.map(extractMessage).filter(Boolean).join(' ')

  if (value && typeof value === 'object') {
    return Object.values(value).map(extractMessage).filter(Boolean).join(' ')
  }

  return value != null ? String(value) : ''
}

// {field: ["msg", ...]} -> {field: "msg"} - a plain string per field, ready for an
// input's :error-message. Reads `error.details` (the contract) and, for older answers,
// the bare field map.
export function parseFieldErrors(data) {
  const fields = {}

  if (!data || typeof data !== 'object' || Array.isArray(data)) return fields

  const details = data.error && typeof data.error === 'object' && !Array.isArray(data.error)
    ? data.error.details
    : null

  const source = details && typeof details === 'object' && !Array.isArray(details) ? details : data

  for (const [key, value] of Object.entries(source)) {
    if (source === data && RESERVED_KEYS.has(key)) continue

    const message = extractMessage(value)
    if (message) fields[key] = message
  }

  return fields
}

// The failure of a request, in one shape: { code, message, details, fields, validation }.
// null when the body carries no error at all.
export function normalizeError(data) {
  if (data == null || data === '') return null

  if (typeof data === 'string') return { code: null, message: data, details: null, fields: {}, validation: false }

  if (typeof data !== 'object') return null

  const error = data.error

  // the contract
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    const fields = parseFieldErrors(data)

    return {
      code: error.code || null,
      message: extractMessage(error.message),
      details: error.details ?? null,
      fields,
      validation: Object.keys(fields).length > 0
    }
  }

  // deprecated shapes
  const fields = parseFieldErrors(data)
  const legacyNonField = Array.isArray(error) ? extractMessage(error) : ''
  const explicit = extractMessage(data.detail) || extractMessage(data.alert_error) || legacyNonField
  const summary = Object.entries(fields).map(([field, msg]) => `${field}: ${msg}`).join(' | ')
  const message = explicit || summary

  if (!message) return null

  return {
    code: typeof data.code === 'string' ? data.code : null,
    message,
    details: null,
    fields,
    validation: !explicit && Object.keys(fields).length > 0
  }
}

// One readable summary of an error body (what a toast shows). Kept for the callers
// that only want text.
export function buildErrorMessage(data) {
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return extractMessage(data)

  const error = normalizeError(data)
  return error ? error.message : ''
}

// The extra alerts of a response: [{ level, message, code, details }], invalid ones dropped.
export function normalizeAlerts(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.alerts)) return []

  return data.alerts
    .filter(alert => alert && typeof alert === 'object' && extractMessage(alert.message))
    .map(alert => ({
      level: normalizeLevel(alert.level),
      message: extractMessage(alert.message),
      code: alert.code || null,
      details: alert.details ?? null
    }))
}

// The message of a failed request (an axios error or its response), or undefined.
// Prefer this over reading `response.data.detail` by hand.
export function errorMessage(error) {
  return normalizeError(error?.response?.data ?? error?.data)?.message || undefined
}

// The stable `code` of a failed request, or undefined. Branch on this, never on the text.
export function errorCode(error) {
  return normalizeError(error?.response?.data ?? error?.data)?.code || undefined
}
