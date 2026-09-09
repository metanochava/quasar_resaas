import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const httpGet = vi.fn()

vi.mock('../services/api', () => ({
  url: ({ url, params }) => {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, item))
        return
      }
      query.append(key, value)
    })
    const qs = query.toString()
    return qs ? `${url}?${qs}` : url
  },
  HTTPAuth: { get: (...args) => httpGet(...args) },
}))

const { useDashboardStore } = await import('./DashboardStore')

beforeEach(() => {
  setActivePinia(createPinia())
  httpGet.mockReset()
})

function widget(overrides = {}) {
  return {
    name: 'w1', type: 'stat', provider: 'p', accepts_filters: [], filters: [],
    ...overrides,
  }
}

describe('DashboardStore.loadDashboard', () => {
  it('stores the authorized dashboard config and seeds default filter values', async () => {
    httpGet.mockResolvedValueOnce({
      data: {
        dashboard: {
          name: 'demo', label: 'Demo',
          filters: [{ name: 'search', type: 'search', default: 'abc' }],
          widgets: [widget()],
        },
      },
    })

    const store = useDashboardStore()
    await store.loadDashboard('demo')

    expect(store.dashboard.name).toBe('demo')
    expect(store.globalFilters.search).toBe('abc')
    expect(store.dashboardError).toBeNull()
  })

  it('captures the standardized error payload on failure (e.g. module not active)', async () => {
    httpGet.mockRejectedValueOnce({
      response: { data: { error: { code: 'module_not_active', message: 'Not active' } } },
    })

    const store = useDashboardStore()
    await store.loadDashboard('demo')

    expect(store.dashboard).toBeNull()
    expect(store.dashboardError.code).toBe('module_not_active')
  })
})

describe('DashboardStore.loadWidget', () => {
  it('populates widgets[name] with the normalized response', async () => {
    const store = useDashboardStore()
    store.dashboard = { name: 'demo', widgets: [widget()], filters: [] }

    httpGet.mockResolvedValueOnce({ data: { type: 'stat', data: { value: 42 } } })

    await store.loadWidget('w1')

    expect(store.widgets.w1.data.value).toBe(42)
    expect(store.widgetLoading.w1).toBe(false)
    expect(store.lastUpdated.w1).toBeTypeOf('number')
  })

  it('stores the error payload without touching widgets[name] on failure', async () => {
    const store = useDashboardStore()
    store.dashboard = { name: 'demo', widgets: [widget()], filters: [] }

    httpGet.mockRejectedValueOnce({
      response: { data: { error: { code: 'permission_denied', message: 'Nope' } } },
    })

    await store.loadWidget('w1')

    expect(store.widgets.w1).toBeUndefined()
    expect(store.widgetErrors.w1.code).toBe('permission_denied')
  })

  it('one widget failing does not affect another widget (Promise.allSettled isolation)', async () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      widgets: [widget({ name: 'ok' }), widget({ name: 'broken' })],
      filters: [],
    }

    httpGet.mockImplementation((requestUrl) => {
      if (String(requestUrl).includes('/broken/')) {
        return Promise.reject({ response: { data: { error: { code: 'x', message: 'boom' } } } })
      }
      return Promise.resolve({ data: { type: 'stat', data: { value: 1 } } })
    })

    await store.loadAllWidgets()

    expect(store.widgets.ok.data.value).toBe(1)
    expect(store.widgetErrors.broken.code).toBe('x')
    expect(store.widgetErrors.ok).toBeNull()
  })

  it('a stale response never overwrites a newer one for the same widget', async () => {
    const store = useDashboardStore()
    store.dashboard = { name: 'demo', widgets: [widget()], filters: [] }

    let resolveFirst
    let resolveSecond

    httpGet
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const firstCall = store.loadWidget('w1')
    const secondCall = store.loadWidget('w1')

    // A resposta mais recente chega primeiro.
    resolveSecond({ data: { type: 'stat', data: { value: 'second' } } })
    await secondCall

    // A resposta antiga chega depois - não pode sobrepor a mais recente.
    resolveFirst({ data: { type: 'stat', data: { value: 'first' } } })
    await firstCall

    expect(store.widgets.w1.data.value).toBe('second')
  })
})

describe('DashboardStore filters', () => {
  it('serializes date_range as {name}_from/{name}_to query params', async () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [{ name: 'period', type: 'date_range' }],
      widgets: [widget({ accepts_filters: ['period'] })],
    }
    store.globalFilters.period = { from: '2026-01-01', to: '2026-01-31' }

    httpGet.mockResolvedValueOnce({ data: { type: 'stat', data: { value: 1 } } })
    await store.loadWidget('w1')

    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('period_from=2026-01-01')
    expect(calledUrl).toContain('period_to=2026-01-31')
  })

  it('serializes multi_select as repeated keys, not a comma-joined value', async () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [{ name: 'status', type: 'multi_select' }],
      widgets: [widget({ accepts_filters: ['status'] })],
    }
    store.globalFilters.status = ['a', 'b']

    httpGet.mockResolvedValueOnce({ data: { type: 'stat', data: { value: 1 } } })
    await store.loadWidget('w1')

    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('status=a')
    expect(calledUrl).toContain('status=b')
    expect(calledUrl).not.toContain('status=a%2Cb')
  })

  it('a widget only receives filters it declared in accepts_filters', async () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [
        { name: 'period', type: 'text' },
        { name: 'other', type: 'text' },
      ],
      widgets: [widget({ accepts_filters: ['period'] })],
    }
    store.globalFilters = { period: 'x', other: 'y' }

    httpGet.mockResolvedValueOnce({ data: { type: 'stat', data: { value: 1 } } })
    await store.loadWidget('w1')

    const calledUrl = httpGet.mock.calls[0][0]
    expect(calledUrl).toContain('period=x')
    expect(calledUrl).not.toContain('other=y')
  })

  it('clears a dependent filter and its cached options when the filter it depends on changes', () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [
        { name: 'branch', type: 'branch' },
        { name: 'doctor', type: 'autocomplete', depends_on: ['branch'] },
      ],
      widgets: [widget()],
    }
    store.globalFilters.doctor = 'dr-1'
    store.filterOptions['w1:doctor'] = [{ value: 'dr-1', label: 'Dr 1' }]

    store.setGlobalFilter('branch', 'b2')

    expect(store.globalFilters.doctor).toBeNull()
    expect(store.filterOptions['w1:doctor']).toBeUndefined()
  })
})

describe('DashboardStore.startAutoRefresh', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reloads a widget on its own interval and clears the timer on stop', () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [],
      widgets: [widget({ refresh: { enabled: true, interval: 5 } })],
    }

    const spy = vi.spyOn(store, 'loadWidget').mockResolvedValue()

    store.startAutoRefresh()
    vi.advanceTimersByTime(5000)
    expect(spy).toHaveBeenCalledWith('w1')

    store.stopAutoRefresh()
    spy.mockClear()
    vi.advanceTimersByTime(10000)
    expect(spy).not.toHaveBeenCalled()
  })

  it('never creates duplicate timers for the same widget across two starts', () => {
    const store = useDashboardStore()
    store.dashboard = {
      name: 'demo',
      filters: [],
      widgets: [widget({ refresh: { enabled: true, interval: 5 } })],
    }

    const spy = vi.spyOn(store, 'loadWidget').mockResolvedValue()

    store.startAutoRefresh()
    store.startAutoRefresh()

    vi.advanceTimersByTime(5000)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('DashboardStore.reset', () => {
  it('clears dashboard/widgets state and stops auto-refresh timers', () => {
    const store = useDashboardStore()
    store.dashboard = { name: 'demo', filters: [], widgets: [widget()] }
    store.widgets.w1 = { type: 'stat', data: { value: 1 } }
    store.startAutoRefresh()

    store.reset()

    expect(store.dashboard).toBeNull()
    expect(store.widgets).toEqual({})
    expect(Object.keys(store._refreshTimers)).toHaveLength(0)
  })
})
