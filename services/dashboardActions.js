// Resolvedor genérico de actions do motor de dashboards
// (django_resaas.engine.core.dashboards) - "route"/"refresh"/
// "fullscreen"/"dialog" agora, extensível para "download"/"export"/
// "print"/"provider_action"/"external_url" mais tarde via
// registerActionHandler(), sem redesenhar nenhum widget (cada widget
// só chama resolveDashboardAction(), nunca sabe como cada tipo
// funciona por dentro).
//
// O backend já filtrou por permissão (DashboardPermissionService) -
// uma action que chega aqui já está autorizada; este ficheiro só
// resolve NAVEGAÇÃO, nunca decide segurança.

import { openDashboardDialog } from './dashboardDialogs'
import { HTTPAuth, url } from './api'
import { sDialog } from './dialog'
import { tdc } from './translation'
import { AlertSuccess } from '../boot/alerts'

// shared by every copy of this module (prebundle + source files), so a
// handler registered by the app reaches the widgets - see dashboardDialogs.js
const HANDLERS_KEY = Symbol.for('quasar_resaas.dashboardActionHandlers')
if (!globalThis[HANDLERS_KEY]) globalThis[HANDLERS_KEY] = {}
const handlers = globalThis[HANDLERS_KEY]

export function registerActionHandler(type, handler) {
  handlers[type] = handler
}

// Substitui "{id}"/"{code}" etc. por valores de `context` (a linha/
// item seleccionado) em strings, arrays e objectos aninhados
// (route.params/route.query) - mesma convenção pedida: "The frontend
// resolves {id} using the selected row".
export function resolveTemplate(value, context) {
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (_, key) => {
      const resolved = context?.[key]
      return resolved === undefined || resolved === null ? `{${key}}` : String(resolved)
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplate(item, context))
  }

  if (value && typeof value === 'object') {
    const result = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = resolveTemplate(val, context)
    }
    return result
  }

  return value
}

// "when": { field, in: [...] } - the action applies only to the rows/items
// whose `field` is one of the values (e.g. check-in only while scheduled).
// UX only: the backend still refuses a transition that is not allowed.
export function actionApplies(action, context) {
  const when = action?.when
  if (!when?.field || !Array.isArray(when.in)) return true
  return when.in.includes(context?.[when.field])
}

// handlers: { router, context, onRefresh, onChanged, onFullscreen, onDialog }
export function resolveDashboardAction(action, handlerContext = {}) {
  if (!action) return

  const handler = handlers[action.type]

  if (!handler) {
    console.warn(`[DashboardActionResolver] unsupported action type: '${action.type}'`)
    return
  }

  return handler(action, handlerContext)
}

registerActionHandler('route', (action, { router, context } = {}) => {
  if (!router || !action.route?.name) return

  router.push({
    name: action.route.name,
    params: resolveTemplate(action.route.params, context),
    query: resolveTemplate(action.route.query, context),
  })
})

registerActionHandler('refresh', (action, { onRefresh } = {}) => {
  onRefresh?.(action)
})

registerActionHandler('fullscreen', (action, { onFullscreen } = {}) => {
  onFullscreen?.(action)
})

// a widget may handle it itself (onDialog); otherwise the dialog registered
// under action.dialog opens with the row/item as context
registerActionHandler('dialog', (action, { onDialog, context, onRefresh } = {}) => {
  if (onDialog) return onDialog(action)
  return openDashboardDialog(action, { context, onSaved: onRefresh })
})

// A write to the backend ({field} placeholders from the row/item), with an
// optional confirmation. Errors go through the normal alert funnel (the
// HTTPAuth interceptor); on success `onChanged` (e.g. reload every widget:
// counters change too) or `onRefresh` runs. Resolves true when it ran.
registerActionHandler('request', (action, { context, onRefresh, onChanged } = {}) => {
  const run = async () => {
    try {
      await HTTPAuth.request({
        method: String(action.request?.method || 'POST').toUpperCase(),
        url: url({ type: 'u', url: resolveTemplate(action.request?.endpoint, context) }),
        data: {}
      })
    } catch {
      return false
    }
    if (action.success) AlertSuccess(tdc(action.success))
    await (onChanged || onRefresh)?.(action)
    return true
  }

  if (!action.confirm) return run()

  return new Promise((resolve) => {
    sDialog({
      title: tdc(action.tooltip || action.name),
      message: tdc(action.confirm),
      persistent: true,
      cancel: true
    })
      .onOk(async () => resolve(await run()))
      .onCancel(() => resolve(false))
  })
})
