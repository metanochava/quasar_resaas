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

const handlers = {}

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

// handlers: { router, context, onRefresh, onFullscreen, onDialog }
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

registerActionHandler('dialog', (action, { onDialog } = {}) => {
  onDialog?.(action)
})
