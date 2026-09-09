// Pinia store do motor de dashboards dinâmicos - consome os 4 endpoints
// genéricos de django_resaas.engine.core.dashboards.views. Não usa
// createBaseStore() (base/base_store.js): esse é pensado para CRUD de
// um único modelo via Schema 1.0 (safeUrl, form, rows paginadas de um
// recurso); aqui o contrato é outro (config + N widgets tipados), por
// isso é uma store dedicada, seguindo a mesma convenção "hand-written"
// já usada por stores/LoadStore.js (defineStore directo + HTTPAuth/url()).
//
// Não confundir com services/dashboardRegistry.js (registerDashboard/
// getDashboards) - esse é um registry client-side de dashboards
// totalmente custom (componentes Vue inteiros que se auto-registam,
// consumidos por <s-dashboard>/DashboardComponent.vue). Esta store
// serve o motor NOVO: dashboards declarados em <app>/dashboard.py no
// backend e renderizados genericamente a partir de um schema JSON.

import { defineStore } from 'pinia'
import { markRaw } from 'vue'

import { HTTPAuth, url } from '../services/api'

function serializeFilterParam(params, name, type, value) {
  if (value === undefined || value === null || value === '') return

  if (type === 'date_range') {
    if (value.from) params[`${name}_from`] = value.from
    if (value.to) params[`${name}_to`] = value.to
    return
  }

  if (type === 'number_range') {
    if (value.min !== undefined && value.min !== null) params[`${name}_min`] = value.min
    if (value.max !== undefined && value.max !== null) params[`${name}_max`] = value.max
    return
  }

  // Array (multi_select) - url() já serializa como chave repetida
  // (name=a&name=b), a mesma convenção usada em todo o resto da
  // plataforma (ver services/api.js's url()).
  params[name] = value
}

function isCanceled(error) {
  return error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED'
}

export const useDashboardStore = defineStore('dashboard', {

  state: () => ({
    // Listagem leve /dashboards/
    dashboards: [],
    dashboardsLoading: false,

    // Dashboard actual (config já autorizada) /dashboard/<name>/
    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,

    // Dados por widget
    widgets: {},
    widgetLoading: {},
    widgetErrors: {},
    lastUpdated: {},

    // Filtros
    globalFilters: {},
    widgetFilters: {},

    // Opções de filtro (autocomplete/select dinâmicos)
    filterOptions: {},
    filterOptionsLoading: {},

    // Bookkeeping interno - não usar directamente fora da store.
    _controllers: {},
    _optionControllers: {},
    _refreshTimers: {},
  }),

  getters: {
    getWidgetConfig: (state) => (name) =>
      (state.dashboard?.widgets || []).find((w) => w.name === name) || null,

    getWidgetData: (state) => (name) => state.widgets[name] ?? null,

    isWidgetLoading: (state) => (name) => !!state.widgetLoading[name],

    getWidgetError: (state) => (name) => state.widgetErrors[name] ?? null,

    getFilterOptions: (state) => (widgetName, filterName) =>
      state.filterOptions[`${widgetName}:${filterName}`] || [],

    isFilterOptionsLoading: (state) => (widgetName, filterName) =>
      !!state.filterOptionsLoading[`${widgetName}:${filterName}`],
  },

  actions: {

    // ============================================================
    // DASHBOARD
    // ============================================================

    async loadDashboardList() {
      this.dashboardsLoading = true
      try {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: 'django_resaas/dashboards/' })
        )
        this.dashboards = data || []
      } finally {
        this.dashboardsLoading = false
      }
    },

    async loadDashboard(name) {
      this.dashboardLoading = true
      this.dashboardError = null

      try {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `django_resaas/dashboard/${name}/` })
        )

        this.dashboard = data.dashboard

        for (const filterDef of this.dashboard.filters || []) {
          if (
            filterDef.default !== undefined
            && filterDef.default !== null
            && this.globalFilters[filterDef.name] === undefined
          ) {
            this.globalFilters[filterDef.name] = filterDef.default
          }
        }
      } catch (error) {
        this.dashboardError = error?.response?.data?.error || {
          code: 'unknown_error',
          message: 'Erro ao carregar dashboard.',
        }
        this.dashboard = null
      } finally {
        this.dashboardLoading = false
      }
    },

    // ============================================================
    // FILTROS
    // ============================================================

    _findFilterDef(widget, name) {
      return (
        (this.dashboard?.filters || []).find((f) => f.name === name)
        || (widget?.filters || []).find((f) => f.name === name)
        || null
      )
    },

    buildWidgetParams(widget) {
      const params = {}

      for (const name of widget.accepts_filters || []) {
        const filterDef = this._findFilterDef(widget, name)
        const value = this.widgetFilters[widget.name]?.[name] ?? this.globalFilters[name]
        serializeFilterParam(params, name, filterDef?.type, value)
      }

      return params
    },

    setGlobalFilter(name, value) {
      this.globalFilters = { ...this.globalFilters, [name]: value }
      this._clearDependents(name)
    },

    setWidgetFilter(widgetName, name, value) {
      this.widgetFilters = {
        ...this.widgetFilters,
        [widgetName]: { ...(this.widgetFilters[widgetName] || {}), [name]: value },
      }
      this._clearDependents(name, widgetName)
    },

    // Filtros dependentes (depends_on): quando o filtro do qual outro
    // depende muda, o valor e as opções em cache do dependente deixam
    // de fazer sentido - limpa ambos, para o componente pedir opções
    // novas (WidgetFilters.vue observa depends_on e chama
    // loadFilterOptions() de novo).
    _clearDependents(changedName, widgetName = null) {
      const allFilterDefs = [
        ...(this.dashboard?.filters || []),
        ...(widgetName ? (this.getWidgetConfig(widgetName)?.filters || []) : []),
      ]

      for (const filterDef of allFilterDefs) {
        if ((filterDef.depends_on || []).includes(changedName)) {
          if (widgetName) {
            this.setWidgetFilter(widgetName, filterDef.name, null)
          } else {
            this.globalFilters = { ...this.globalFilters, [filterDef.name]: null }
          }

          for (const key of Object.keys(this.filterOptions)) {
            if (key.endsWith(`:${filterDef.name}`)) {
              delete this.filterOptions[key]
            }
          }
        }
      }
    },

    clearFilters() {
      this.globalFilters = {}
      this.widgetFilters = {}
    },

    async applyFilters() {
      await this.loadAllWidgets()
    },

    filtersAsQuery() {
      // Serialização plana para preservar na URL (?name=value), quem
      // chama decide se/quando sincronizar com vue-router - a store
      // não depende do router.
      const query = {}
      for (const [name, value] of Object.entries(this.globalFilters)) {
        if (value === undefined || value === null || value === '') continue
        query[name] = typeof value === 'object' ? JSON.stringify(value) : value
      }
      return query
    },

    restoreFiltersFromQuery(query = {}) {
      const restored = {}
      for (const [name, raw] of Object.entries(query)) {
        try {
          restored[name] = typeof raw === 'string' && (raw.startsWith('{') || raw.startsWith('['))
            ? JSON.parse(raw)
            : raw
        } catch {
          restored[name] = raw
        }
      }
      this.globalFilters = { ...this.globalFilters, ...restored }
    },

    // ============================================================
    // WIDGET DATA
    // ============================================================

    async loadWidget(widgetName, extraParams = {}) {
      const widget = this.getWidgetConfig(widgetName)
      if (!widget || !this.dashboard) return

      // Cancela o request anterior deste widget - impede que uma
      // resposta antiga (filtros trocados depressa) sobreponha uma
      // mais recente.
      this._controllers[widgetName]?.abort()
      const controller = markRaw(new AbortController())
      this._controllers[widgetName] = controller

      this.widgetLoading = { ...this.widgetLoading, [widgetName]: true }
      this.widgetErrors = { ...this.widgetErrors, [widgetName]: null }

      try {
        const params = { ...this.buildWidgetParams(widget), ...extraParams }

        const { data } = await HTTPAuth.get(
          url({
            type: 'u',
            url: `django_resaas/dashboard/${this.dashboard.name}/widget/${widgetName}/`,
            params,
          }),
          { signal: controller.signal }
        )

        // Só a resposta do controller ainda "actual" pode escrever -
        // segunda garantia de anti-race além do abort() acima.
        if (this._controllers[widgetName] !== controller) return

        this.widgets = { ...this.widgets, [widgetName]: data }
        this.lastUpdated = { ...this.lastUpdated, [widgetName]: Date.now() }
      } catch (error) {
        if (isCanceled(error)) return
        if (this._controllers[widgetName] !== controller) return

        this.widgetErrors = {
          ...this.widgetErrors,
          [widgetName]: error?.response?.data?.error || {
            code: 'unknown_error',
            message: 'Erro ao carregar widget.',
          },
        }
      } finally {
        if (this._controllers[widgetName] === controller) {
          this.widgetLoading = { ...this.widgetLoading, [widgetName]: false }
        }
      }
    },

    reloadWidget(widgetName) {
      return this.loadWidget(widgetName)
    },

    async loadAllWidgets() {
      // Promise.allSettled: um widget a falhar nunca quebra os
      // outros - cada um trata o seu próprio estado de erro.
      const widgets = this.dashboard?.widgets || []
      await Promise.allSettled(widgets.map((w) => this.loadWidget(w.name)))
    },

    // ============================================================
    // OPÇÕES DE FILTRO
    // ============================================================

    async loadFilterOptions(widgetName, filterName) {
      if (!this.dashboard) return

      const key = `${widgetName}:${filterName}`

      this._optionControllers[key]?.abort()
      const controller = markRaw(new AbortController())
      this._optionControllers[key] = controller

      this.filterOptionsLoading = { ...this.filterOptionsLoading, [key]: true }

      try {
        const { data } = await HTTPAuth.get(
          url({
            type: 'u',
            url: `django_resaas/dashboard/${this.dashboard.name}/widget/${widgetName}/filters/${filterName}/options/`,
          }),
          { signal: controller.signal }
        )

        if (this._optionControllers[key] !== controller) return

        this.filterOptions = { ...this.filterOptions, [key]: data.options || [] }
      } catch (error) {
        if (isCanceled(error)) return
      } finally {
        if (this._optionControllers[key] === controller) {
          this.filterOptionsLoading = { ...this.filterOptionsLoading, [key]: false }
        }
      }
    },

    // ============================================================
    // AUTO REFRESH
    // ============================================================

    startAutoRefresh() {
      this.stopAutoRefresh()

      const dashboardRefresh = this.dashboard?.refresh

      for (const widget of this.dashboard?.widgets || []) {
        const refresh = widget.refresh || dashboardRefresh

        if (!refresh?.enabled || !refresh?.interval) continue

        this._refreshTimers[widget.name] = setInterval(() => {
          this.loadWidget(widget.name)
        }, refresh.interval * 1000)
      }
    },

    stopAutoRefresh() {
      for (const timer of Object.values(this._refreshTimers)) {
        clearInterval(timer)
      }
      this._refreshTimers = {}
    },

    // ============================================================
    // RESET
    // ============================================================

    reset() {
      this.stopAutoRefresh()

      Object.values(this._controllers).forEach((c) => c?.abort())
      Object.values(this._optionControllers).forEach((c) => c?.abort())

      this.dashboard = null
      this.dashboardError = null
      this.widgets = {}
      this.widgetLoading = {}
      this.widgetErrors = {}
      this.lastUpdated = {}
      this.globalFilters = {}
      this.widgetFilters = {}
      this.filterOptions = {}
      this._controllers = {}
      this._optionControllers = {}
    },
  },
})
