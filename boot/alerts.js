import { Notify } from 'quasar'
import { useAlertStore } from '../stores/AlertStore'
import { tdc } from '../services/translation'

/* =========================
   Utils
========================= */

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
    if (data?.status === 201) { sms = 'Created successfully!'; go = true }
    if (data?.status === 202) { sms = 'Processed successfully!'; go = true }
    if (data?.status === 203) { sms = 'Modified successfully!'; go = true }
    if (data?.status === 204) { sms = 'Deleted successfully!'; go = true }

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
  }

  if (go) pushAlert(sms, tipo)
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
      sms = data?.data || 'Authentication error'
      go = true
    }

    if (data?.status === 404) {
      sms = data?.data?.detail || 'Resource not found'
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
