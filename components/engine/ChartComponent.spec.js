import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'

// ApexCharts draws SVG with layout APIs jsdom does not have: the component is
// tested through the options it hands to it
const instances = []
vi.mock('apexcharts', () => ({
  default: class {
    constructor (el, options) { this.options = options; this.destroyed = false; instances.push(this) }
    render () { return Promise.resolve() }
    updateOptions (options) { this.options = options; return Promise.resolve() }
    destroy () { this.destroyed = true }
  }
}))

import ChartComponent from './ChartComponent.vue'
import { useUserStore } from '../../stores/UserStore'

let pinia

beforeEach(() => {
  instances.length = 0
  pinia = createPinia()
  setActivePinia(pinia)
  useUserStore().Theme = { primary: '#111111', secondary: '#222222', accent: '#333333', info: '#444444', positive: '#00aa00', warning: '#ffaa00', negative: '#dd0000' }
})

afterEach(() => vi.restoreAllMocks())

async function render (props) {
  const wrapper = mount(ChartComponent, { props, global: { plugins: [Quasar, pinia] } })
  await flushPromises()
  return { wrapper, chart: instances[instances.length - 1] }
}

describe('s-chart', () => {
  it('draws an axis chart with the Theme colours in order and a legend only for several series', async () => {
    const { chart } = await render({
      type: 'bar', labels: ['Mon', 'Tue'],
      series: [{ name: 'Visits', data: [4, 7] }, { name: 'Calls', data: [1, 2] }]
    })

    expect(chart.options.chart.type).toBe('bar')
    expect(chart.options.colors).toEqual(['#111111', '#222222'])
    expect(chart.options.xaxis.categories).toEqual(['Mon', 'Tue'])
    expect(chart.options.series[0]).toEqual({ name: 'Visits', data: [4, 7] })
    expect(chart.options.legend.show).toBe(true)
    expect(chart.options.plotOptions.bar.borderRadius).toBe(4)
  })

  it('a single series has no legend box', async () => {
    const { chart } = await render({ type: 'line', labels: ['a'], series: [{ name: 'One', data: [1] }] })

    expect(chart.options.legend.show).toBe(false)
  })

  it('a series or a category can ask for a semantic Theme colour', async () => {
    const { chart } = await render({ type: 'donut', labels: ['Present', 'Absent'], series: [5, 1], colors: ['positive', 'negative'] })
    const bars = await render({ type: 'bar', labels: ['Paid', 'Cancelled'], series: [{ name: 'Payrolls', data: [3, 1] }], colors: ['positive', 'negative'] })

    expect(chart.options.colors).toEqual(['#00aa00', '#dd0000'])
    expect(bars.chart.options.colors).toEqual(['#00aa00', '#dd0000'])
    expect(bars.chart.options.plotOptions.bar.distributed).toBe(true)
  })

  it('more than eight slices fold into "Other"', async () => {
    const labels = Array.from({ length: 10 }, (_, i) => `S${i}`)
    const { chart } = await render({ type: 'pie', labels, series: labels.map(() => 1) })

    expect(chart.options.series).toHaveLength(8)
    expect(chart.options.series[7]).toBe(3)
    expect(chart.options.labels[7]).toBe('Other')
  })

  it('uses the given formatter for values', async () => {
    const { chart } = await render({ type: 'donut', labels: ['Docs'], series: [2048], format: (v) => `${v / 1024} KB` })

    expect(chart.options.tooltip.y.formatter(2048)).toBe('2 KB')
  })

  it('emits select with the clicked category', async () => {
    const { wrapper, chart } = await render({ type: 'bar', labels: ['A', 'B'], series: [{ name: 'X', data: [1, 2] }] })

    chart.options.chart.events.dataPointSelection(null, null, { dataPointIndex: 1, seriesIndex: 0 })

    expect(wrapper.emitted('select')[0][0]).toEqual({ index: 1, seriesIndex: 0, label: 'B' })
  })

  it('repaints when the data or the Theme changes, and is destroyed with the component', async () => {
    const { wrapper, chart } = await render({ type: 'line', labels: ['a'], series: [{ name: 'One', data: [1] }] })

    await wrapper.setProps({ series: [{ name: 'One', data: [9] }] })
    await flushPromises()
    expect(chart.options.series[0].data).toEqual([9])

    useUserStore().Theme = { ...useUserStore().Theme, primary: '#999999' }
    await flushPromises()
    expect(chart.options.colors[0]).toBe('#999999')

    wrapper.unmount()
    expect(chart.destroyed).toBe(true)
  })
})
