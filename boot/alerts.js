import { Notify } from 'quasar'
import { useAlertStore } from '../stores/AlertStore'
import { tdc } from '../services/translation'
import {
  levelToQuasar,
  normalizeAlerts,
  normalizeError,
  parseFieldErrors,
  buildErrorMessage
} from '../utils/apiContract'

// The single funnel for everything a request wants the user to see. Every alert,
// error and message goes through pushAlert(): it decides (policy) whether the user
// gets an immediate toast and/or a line in the history kept by the AlertStore, which
// the header Notification (HeaderNotifications) shows. Components must not call
// Notify.create for API feedback - use Alert(response) / AlertSuccess(...) / etc.

// Re-exported: stores map validation errors onto their fields with these.
export { parseFieldErrors, buildErrorMessage }

// Configurable per consumer app (.env's ALERT_TIMEOUT, whitelisted into
// the client bundle via quasar.config.js's build.env, same convention
// as API_PREFIX/FRONT_END_KEY/GOOGLE_MAPS_API_KEY - see services/api.js)
// - falls back to Quasar's own previous hardcoded value when unset, so
// a consumer app that hasn't defined it yet keeps working unchanged.
const ALERT_TIMEOUT = Number(process.env.ALERT_TIMEOUT) || 8000

// What each level does: `toast` = immediate Notify, `history` = kept in the AlertStore
// (and so in the header Notification). One place to change the policy, none of the
// components decide it. Adjust with setAlertPolicy({ success: { toast: false } }).
const alertPolicy = {
  success: { toast: true, history: true },
  info: { toast: true, history: true },
  warning: { toast: true, history: true },
  error: { toast: true, history: true }
}

export const getAlertPolicy = () => JSON.parse(JSON.stringify(alertPolicy))

export const setAlertPolicy = (partial = {}) => {
  for (const [level, rule] of Object.entries(partial)) {
    if (alertPolicy[level]) Object.assign(alertPolicy[level], rule)
  }
}

// The same message twice within this window is one message: a retried request, or a
// response seen by two interceptors, must not toast or log twice.
const DEDUPE_MS = 1500
const recent = new Map()

const isDuplicate = (key) => {
  const now = Date.now()

  for (const [seen, at] of recent) {
    if (now - at > DEDUPE_MS) recent.delete(seen)
  }

  if (recent.has(key)) return true

  recent.set(key, now)
  return false
}

export const resetAlertDedupe = () => recent.clear()

// `options`: { code, details, request: {method, path}, toast, history } - `toast` /
// `history` false override the level's policy for this message (e.g. a generic
// "Created successfully!" is feedback, not something worth keeping).
const pushAlert = (sms, type = 'info', options = {}) => {
  const level = ['success', 'info', 'warning', 'error'].includes(type) ? type : 'info'
  const message = tdc(String(sms))

  if (isDuplicate(`${level}|${options.code || ''}|${message}`)) return

  const policy = alertPolicy[level]

  if (policy.history && options.history !== false) {
    useAlertStore().add({
      level,
      message,
      code: options.code || null,
      details: options.details ?? null,
      request: options.request || null
    })
  }

  if (!policy.toast || options.toast === false) return

  Notify.create({
    type: levelToQuasar(level),
    message,
    position: 'top-right',
    html: true,
    // Quasar's own default (5000ms) was too short to read anything beyond a
    // one-word message - every alert funnels through here, so this covers all.
    timeout: ALERT_TIMEOUT,
    actions: [
      { icon: 'close', color: 'white', round: true }
    ]
  })
}

// {method, path} of the request that produced a response - client-side metadata
// for the history, never sent anywhere. Query strings are dropped (they can carry
// filters or tokens).
const requestMeta = (response) => {
  const config = response?.config
  if (!config?.url) return null

  let path = String(config.url)

  try {
    path = new URL(path, 'http://resaas.local').pathname
  } catch {
    path = path.split('?')[0]
  }

  return { method: String(config.method || 'get').toUpperCase(), path }
}

// The `alerts` of a response body (contract), whatever its status.
const pushContractAlerts = (body, request) => {
  for (const alert of normalizeAlerts(body)) {
    pushAlert(alert.message, alert.level, { code: alert.code, details: alert.details, request })
  }
}

/* =========================
   SUCCESS
========================= */
const AlertSuccess = (data) => {
  // a component's own success message
  if (typeof data === 'string') {
    pushAlert(data, 'success')
    return
  }

  if (typeof data !== 'object' || data === null) return

  const request = requestMeta(data)

  // the contract: any number of alerts next to the normal payload (any 2xx)
  pushContractAlerts(data?.data, request)

  // Older answers: a status-based generic message, then the backend's alert_* keys.
  // A plain 200 stays silent (as before) - GETs and reads must not toast.
  let sms = ''
  let tipo = 'success'
  let go = false
  let generic = false

  if (data?.status === 201) { sms = 'Created successfully!'; go = true; generic = true }
  if (data?.status === 202) { sms = 'Processed successfully!'; go = true; generic = true }
  if (data?.status === 203) { sms = 'Modified successfully!'; go = true; generic = true }
  if (data?.status === 204) { sms = 'Deleted successfully!'; go = true; generic = true }

  // A write request (POST/PUT/PATCH/DELETE) answered with a plain 200 OK - DRF's
  // default for update/destroy - is covered by none of the codes above.
  if (!go && data?.status === 200) {
    const method = String(data?.config?.method || '').toLowerCase()

    if (method === 'post')  { sms = 'Processed successfully!'; go = true; generic = true }
    if (method === 'put' || method === 'patch') { sms = 'Modified successfully!'; go = true; generic = true }
    if (method === 'delete') { sms = 'Deleted successfully!'; go = true; generic = true }
  }

  // backend messages
  if (data?.data?.alert_success) { sms = data.data.alert_success; go = true; generic = false }

  if (data?.data?.alert_info) { sms = data.data.alert_info; tipo = 'info'; go = true; generic = false }

  if (data?.data?.alert_warning) { sms = data.data.alert_warning; tipo = 'warning'; go = true; generic = false }

  if (data?.status !== 200 && go) {
    // "Created successfully!" is feedback for the click, not a message to keep
    pushAlert(sms, tipo, { request, history: !generic })
  }
}

/* =========================
   ERROR
========================= */
const AlertError = (error) => {
  let sms = 'Unexpected error'
  let go = false

  // axios error
  const data = error?.response || error
  const body = data?.data
  const request = requestMeta(data)

  // direct string
  if (typeof error === 'string') {
    pushAlert(error, 'error')
    return
  }

  // extra alerts an error response may carry next to its error
  pushContractAlerts(body, request)

  const failure = normalizeError(body)

  if (data?.status) {
    if ([400, 401, 403].includes(data.status)) { sms = failure?.message || 'Authentication error'; go = true }
    if (data.status === 404) { sms = failure?.message || 'Resource not found'; go = true }
    if (data.status === 413) { sms = 'Request Entity Too Large'; go = true }
    if (data.status === 500) { sms = failure?.message || 'Internal server error'; go = true }

    // any other status that says something (409, 429, 502, ...)
    if (!go && data.status >= 400 && failure?.message) { sms = failure.message; go = true }

    if (body?.alert_error) { sms = body.alert_error; go = true }
    if (failure?.message && data.status !== 413) { sms = failure.message; go = true }
  }

  if (!go) return

  pushAlert(sms, 'error', {
    code: failure?.code,
    details: failure?.validation ? null : failure?.details,
    request,
    // field errors are shown at their fields (not repeated in the history), and a
    // 401 is the sign-in flow talking, not something to read again
    history: !(failure?.validation || data?.status === 401)
  })
}

/* =========================
   INFO
========================= */
const AlertInfo = (data) => {
  pushAlert(data, 'info')
}

/* =========================
   WARNING
========================= */
const AlertWarning = (data) => {
  pushAlert(data, 'warning')
}

/* =========================
   AUTO HANDLER
========================= */
const Alert = (response) => {
  if (!response) return

  // axios response
  if (response?.status >= 200 && response?.status < 300) {
    AlertSuccess(response)
    return
  }

  if (response?.status >= 400) {
    AlertError(response)
    return
  }

  // string fallback
  if (typeof response === 'string') {
    AlertInfo(response)
  }
}

export {
  AlertSuccess,
  AlertError,
  AlertInfo,
  AlertWarning,
  Alert
}
