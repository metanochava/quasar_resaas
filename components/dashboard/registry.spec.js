import { describe, it, expect, vi } from 'vitest'

// registry.js importa os 7 componentes .vue reais - o projecto não
// tem @vitejs/plugin-vue configurado em vitest.config.js (nenhum
// outro *.spec.js existente compila SFCs), por isso este teste
// verifica a lógica do registry (map/register/resolve) sem depender
// da compilação real dos componentes, mockando cada import .vue.
vi.mock('./StatCardWidget.vue', () => ({ default: { name: 'StatCardWidget' } }))
vi.mock('./BarChartWidget.vue', () => ({ default: { name: 'BarChartWidget' } }))
vi.mock('./LineChartWidget.vue', () => ({ default: { name: 'LineChartWidget' } }))
vi.mock('./PieChartWidget.vue', () => ({ default: { name: 'PieChartWidget' } }))
vi.mock('./TableWidget.vue', () => ({ default: { name: 'TableWidget' } }))
vi.mock('./ListWidget.vue', () => ({ default: { name: 'ListWidget' } }))
vi.mock('./CalendarWidget.vue', () => ({ default: { name: 'CalendarWidget' } }))

const { widgetComponents, registerWidgetType, resolveWidgetComponent } = await import('./registry')

describe('widget registry', () => {
  it('knows the 7 built-in widget types', () => {
    expect(Object.keys(widgetComponents).sort()).toEqual(
      ['bar_chart', 'calendar', 'line_chart', 'list', 'pie_chart', 'stat', 'table'].sort()
    )
  })

  it('resolves a known type to its component', () => {
    expect(resolveWidgetComponent('stat')).toBe(widgetComponents.stat)
  })

  it('returns null for an unknown type instead of throwing', () => {
    expect(resolveWidgetComponent('heatmap')).toBeNull()
  })

  it('registering a new type makes it resolvable without touching the renderer', () => {
    const FakeComponent = { name: 'FakeHeatmap' }
    registerWidgetType('heatmap', FakeComponent)

    expect(resolveWidgetComponent('heatmap')).toBe(FakeComponent)
  })
})
