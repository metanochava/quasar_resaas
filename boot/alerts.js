import { Notify } from 'quasar'
import { useAlertStore } from '../stores/AlertStore'
import { tdc } from '../services/translation'

/* =========================
   Utils
========================= */

// Backend validation errors (DRF serializer.errors) come back as
// {field: ["msg", ...]} - nested one level for nested serializers
// (e.g. address: {country_code: [...]}). Collapses any of those
// shapes down to one readable string instead of the array/object
// itself ending up in a toast as "[object Object]" or "msg1,msg2".
function extractMessage(value) {
  if (Array.isArray(value)) {
    return value.map(extractMessage).filter(Boolean).join(' ')
  }

  if (value && typeof value === 'object') {
    return Object.values(value).map(extractMessage).filter(Boolean).join(' ')
  }

  return value != null ? String(value) : ''
}

const RESERVED_ERROR_KEYS = new Set([
  'detail', 'alert_error', 'alert_success', 'alert_info', 'alert_warning'
])

// {field: ["msg", ...]} -> {field: "msg"} - one plain string per
// field, ready to bind straight onto an s-input's :error-message
// (never the raw array DRF returns).
export function parseFieldErrors(data) {
  const fields = {}

  if (!data || typeof data !== 'object' || Array.isArray(data)) return fields

  for (const [key, value] of Object.entries(data)) {
    if (RESERVED_ERROR_KEYS.has(key)) continue
    const message = extractMessage(value)
    if (message) fields[key] = message
  }

  return fields
}

// One human-readable summary of a backend error body, for the toast -
// prefers detail/alert_error, otherwise joins every field's message.
export function buildErrorMessage(data) {
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return extractMessage(data)

  if (data && typeof data === 'object') {
    if (data.detail) return extractMessage(data.detail)
    if (data.alert_error) return extractMessage(data.alert_error)

    const fields = parseFieldErrors(data)
    const parts = Object.entries(fields).map(([field, msg]) => `${field}: ${msg}`)
    if (parts.length) return parts.join(' | ')
  }

  return ''
}

const pushAlert = (sms, type = 'info') => {
  const Alerta = useAlertStore()

  const msg = tdc(String(sms))

  Alerta.add({
    id: Date.now() + Math.random(),
    sms: msg,
    type
  })

  Notify.create({
    type:
      type === 'success' ? 'positive' :
      type === 'error'   ? 'negative' :
      type,
    message: msg,
    position: 'top-right',
    html: true,
    actions: [
      { icon: 'close', color: 'white', round: true }
    ]
  })
}

/* =========================
   SUCCESS
========================= */
const AlertSuccess = (data) => {
  let sms = ''
  let tipo = 'success'
  let go = false

  // direct string
  if (typeof data === 'string') {
    sms = data
    go = true
  }

  // response object
  if (typeof data === 'object' && data !== null) {

    // status codes
    if (data?.status === 200) { sms = 'Created successfully!'; go = false }
    if (data?.status === 201) { sms = 'Created successfully!'; go = true }
    if (data?.status === 202) { sms = 'Processed successfully!'; go = true }
    if (data?.status === 203) { sms = 'Modified successfully!'; go = true }
    if (data?.status === 204) { sms = 'Deleted successfully!'; go = true }

    // A write request (POST/PUT/PATCH/DELETE) answered with a plain
    // 200 OK - DRF's default for update/destroy - wasn't covered by
    // any of the status checks above (those only match the less
    // common 201/202/203/204), so gravar/apagar/actualizar silently
    // never alerted. GET/read requests are deliberately excluded.
    if (!go && data?.status === 200) {
      const method = String(data?.config?.method || '').toLowerCase()

      if (method === 'post')  { sms = 'Processed successfully!'; go = true }
      if (method === 'put' || method === 'patch') { sms = 'Modified successfully!'; go = true }
      if (method === 'delete') { sms = 'Deleted successfully!'; go = true }
    }

    // backend messages
    if (data?.data?.alert_success) {
      sms = data?.data?.alert_success
      go = true
    }

    if (data?.data?.alert_info) {
      sms = data?.data?.alert_info
      tipo = 'info'
      go = true
    }

    if (data?.data?.alert_warning) {
      sms = data?.data?.alert_warning
      tipo = 'warning'
      go = true
    }
  }
  if (data?.status !== 200) { 
    if (go) pushAlert(sms, tipo)
  }
}

/* =========================
   ERROR
========================= */
const AlertError = (error) => {
  let sms = 'Unexpected error'
  let tipo = 'error'
  let go = false

  // axios error
  const data = error?.response || error

  // direct string
  if (typeof error === 'string') {
    sms = error
    go = true
  }

  if (data?.status) {

    if ([400,401,403].includes(data?.status)) {
      sms = buildErrorMessage(data?.data) || 'Authentication error'
      go = true
    }

    if (data?.status === 404) {
      sms = buildErrorMessage(data?.data) || 'Resource not found'
      go = true
    }

    if (data?.status === 413) {
      sms = 'Request Entity Too Large'
      go = true
    }

    if (data?.status === 500) {
      sms = 'Internal server error'
      go = true
    }

    if (data?.data?.alert_error) {
      sms = data?.data?.alert_error
      go = true
    }

    if (data?.data?.detail) {
      sms = data?.data?.detail
      go = true
    }
  }

  if (go) pushAlert(sms, tipo)
}

/* =========================
   INFO
========================= */
const AlertInfo = (data) => {
  pushAlert(data, 'info')
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
  Alert
}
