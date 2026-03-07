import { Notify } from 'quasar'
import { tdc } from './base'
import { AlertStore } from '../stores/TipoEntidadeStore'

/* =========================
   Utils
========================= */
const getAlertStore = () => AlertStore()

const pushAlert = (sms, type = 'info') => {
  const Alerta = getAlertStore()

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

  // string direta
  if (typeof data === 'string') {
    sms = data
    go = true
  }

  // response object
  if (typeof data === 'object' && data !== null) {

    // status codes
    if (data?.status === 201) { sms = 'Criado com sucesso!'; go = true }
    if (data?.status === 202) { sms = 'Processado com sucesso!'; go = true }
    if (data?.status === 203) { sms = 'Modificado com sucesso!'; go = true }
    if (data?.status === 204) { sms = 'Apagado com sucesso!'; go = true }

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
  let sms = 'Erro inesperado'
  let tipo = 'error'
  let go = false

  // axios error
  const data = error?.response || error

  // string direta
  if (typeof error === 'string') {
    sms = error
    go = true
  }

  if (data?.status) {

    if ([400,401,403].includes(data?.status)) {
      sms = data?.data || 'Erro de autenticação'
      go = true
    }

    if (data?.status === 404) {
      sms = data?.data?.detail || 'Recurso não encontrado'
      go = true
    }

    if (data?.status === 413) {
      sms = 'Request Entity Too Large'
      go = true
    }

    if (data?.status === 500) {
      sms = 'Erro interno do servidor'
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
