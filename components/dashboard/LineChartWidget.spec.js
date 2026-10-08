import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import LineChartWidget from './LineChartWidget.vue'

const data = { labels: ['Jan', 'Feb'], series: [{ name: 'Hb', data: [12, 13] }] }

function mountWidget (props) {
  return mount(LineChartWidget, { props, global: { stubs: { 's-chart': { name: 's-chart', props: ['type', 'labels', 'series', 'height', 'options'], template: '<div />' } } } })
}

describe('LineChartWidget', () => {
  it('passes extra ApexCharts options through to s-chart', () => {
    const options = { annotations: { yaxis: [{ y: 12, y2: 16 }] } }

    const chart = mountWidget({ data, options }).findComponent({ name: 's-chart' })

    expect(chart.props('options')).toEqual(options)
    expect(chart.props('series')).toEqual(data.series)
  })

  it('defaults to no extra options (dashboards are unchanged)', () => {
    const chart = mountWidget({ data }).findComponent({ name: 's-chart' })

    expect(chart.props('options')).toEqual({})
    expect(chart.props('type')).toBe('line')
  })
})
