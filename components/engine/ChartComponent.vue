<script setup>
// s-chart: the ONE chart component of RESAAS, built on ApexCharts.
//
//   <s-chart type="bar" :labels="['Mon', 'Tue']" :series="[{ name: 'Visits', data: [4, 7] }]" />
//   <s-chart type="donut" :labels="['A', 'B']" :series="[3, 5]" :format="humanSize" />
//
// Colours come from the Entity's Theme (backend configuration, User.Theme) in a
// fixed order - utils/chartTheme.js; a series (or, on pie/donut, a slice via
// `colors`) can ask for a semantic one: { name, data, color: 'negative' }.
// Dark mode, the Theme and the data are all reactive. The chart keeps the
// look of the app (fonts inherited, transparent background, recessive grid,
// 2px lines, rounded bar ends, a tooltip on every mark).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import { chartColors, chartSurface, resolveColor } from '../../utils/chartTheme'

const props = defineProps({
  // line | area | bar | donut | pie | radialBar
  type: { type: String, default: 'line' },
  // axis charts: [{ name, data: [...], color? }]; pie/donut/radialBar: [n, n, ...]
  series: { type: Array, default: () => [] },
  // categories (axis charts) or slice names (pie/donut)
  labels: { type: Array, default: () => [] },
  // one colour per category (same index as labels): the slices of a pie/donut,
  // or the bars of a single-series bar chart - a Theme name ('positive', ...) or a colour
  colors: { type: Array, default: () => [] },
  height: { type: [String, Number], default: 260 },
  horizontal: { type: Boolean, default: false },
  stacked: { type: Boolean, default: false },
  // value -> text, used by tooltips, axes and the donut total
  format: { type: Function, default: null },
  // donut: the caption under the total
  totalLabel: { type: String, default: 'Total' },
  // ApexCharts options merged over the computed ones (escape hatch)
  options: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select'])

const $q = useQuasar()
const User = useUserStore()
const el = ref(null)
let chart = null
let ApexCharts = null

const isCircular = computed(() => ['donut', 'pie', 'radialBar'].includes(props.type))
const MAX_SLICES = 8

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
function show (value) {
  if (value === null || value === undefined || value === '') return '-'
  return props.format ? props.format(value) : number.format(Number(value))
}

// pie/donut: more than eight slices fold into "Other" (a colour is never generated)
const circular = computed(() => {
  const values = props.series.map((v) => Number(v) || 0)
  const labels = props.labels.map((l) => String(l ?? ''))
  if (values.length <= MAX_SLICES) return { values, labels, colors: props.colors }
  const kept = MAX_SLICES - 1
  return {
    values: [...values.slice(0, kept), values.slice(kept).reduce((a, b) => a + b, 0)],
    labels: [...labels.slice(0, kept), tdc('Other')],
    colors: props.colors.slice(0, kept)
  }
})

function buildOptions () {
  const dark = $q.dark.isActive
  const theme = User.Theme || {}
  const palette = chartColors(theme, dark)
  const ink = chartSurface(theme, dark)

  const axisSeries = isCircular.value ? [] : props.series.map((s) => ({ name: tdc(s.name ?? ''), data: (s.data || []).map((v) => (v === null || v === undefined || v === '' ? null : Number(v))) }))
  // bars coloured per category (e.g. a status each) instead of per series
  const distributed = !isCircular.value && props.colors.length > 0
  const colors = isCircular.value
    ? circular.value.values.map((_, i) => resolveColor(theme, circular.value.colors?.[i]) || palette[i % palette.length])
    : distributed
      ? props.labels.map((_, i) => resolveColor(theme, props.colors[i]) || palette[i % palette.length])
      : props.series.map((s, i) => resolveColor(theme, s.color) || palette[i % palette.length])

  const base = {
    chart: {
      type: props.type,
      height: props.height,
      stacked: props.stacked,
      background: 'transparent',
      fontFamily: 'inherit',
      foreColor: ink.text,
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 450, animateGradually: { enabled: true, delay: 60 }, dynamicAnimation: { enabled: true, speed: 350 } },
      events: {
        dataPointSelection: (event, ctx, config) => {
          const index = config.dataPointIndex
          const label = isCircular.value ? circular.value.labels[index] : props.labels[index]
          // the folded "Other" slice is not a real item
          if (isCircular.value && props.series.length > MAX_SLICES && index === MAX_SLICES - 1) return
          emit('select', { index, seriesIndex: config.seriesIndex, label })
        }
      }
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors,
    series: isCircular.value ? circular.value.values : axisSeries,
    labels: isCircular.value ? circular.value.labels.map((l) => tdc(l)) : undefined,
    dataLabels: { enabled: false },
    grid: {
      borderColor: ink.grid,
      strokeDashArray: 3,
      padding: { left: 8, right: 8, top: 0, bottom: 0 },
      xaxis: { lines: { show: props.horizontal } },
      yaxis: { lines: { show: !props.horizontal } }
    },
    legend: {
      show: isCircular.value || (props.series.length > 1 && !distributed),
      position: 'bottom',
      fontSize: '12px',
      markers: { size: 5, shape: 'circle', strokeWidth: 0, offsetX: -3 },
      itemMargin: { horizontal: 14, vertical: 4 },
      labels: { colors: ink.text },
      formatter: isCircular.value
        ? (name, opts) => `${name} · ${show(opts.w.globals.series[opts.seriesIndex])}`
        : undefined
    },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      shared: !isCircular.value && props.series.length > 1 && props.type !== 'bar',
      intersect: false,
      y: { formatter: (value) => show(value) }
    },
    states: {
      hover: { filter: { type: 'lighten', value: 0.08 } },
      active: { filter: { type: 'darken', value: 0.12 } }
    },
    stroke: {
      curve: 'smooth',
      lineCap: 'round',
      // bars and slices: a 2px gap in the surface colour between marks
      width: 2,
      colors: props.type === 'bar' ? ['transparent'] : isCircular.value ? [ink.surface] : undefined
    },
    markers: {
      size: props.type === 'line' ? 4 : 0,
      strokeWidth: 2,
      strokeColors: ink.surface,
      hover: { size: 6 }
    },
    fill: props.type === 'area'
      ? { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: 0.32, opacityTo: 0.02, stops: [0, 95] } }
      : { opacity: 1 }
  }

  if (!isCircular.value) {
    base.xaxis = {
      categories: props.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        trim: true,
        hideOverlappingLabels: true,
        style: { fontSize: '11px' },
        formatter: props.horizontal ? (value) => show(value) : undefined
      }
    }
    base.yaxis = {
      labels: {
        style: { fontSize: '11px' },
        maxWidth: 160,
        formatter: props.horizontal ? undefined : (value) => show(value)
      },
      forceNiceScale: true
    }
    base.plotOptions = {
      bar: {
        horizontal: props.horizontal,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        columnWidth: '55%',
        barHeight: '62%',
        distributed
      }
    }
  } else {
    base.plotOptions = {
      pie: {
        expandOnClick: false,
        donut: {
          size: '70%',
          labels: {
            show: props.type === 'donut',
            name: { show: true, fontSize: '12px', offsetY: 18, color: ink.text },
            value: { show: true, fontSize: '22px', fontWeight: 700, offsetY: -12, formatter: (value) => show(value) },
            total: {
              show: true,
              showAlways: true,
              label: tdc(props.totalLabel),
              fontSize: '12px',
              color: ink.text,
              formatter: (w) => show(w.globals.seriesTotals.reduce((a, b) => a + b, 0))
            }
          }
        }
      },
      radialBar: {
        hollow: { size: '58%' },
        track: { background: ink.grid },
        dataLabels: { value: { formatter: (value) => show(value) } }
      }
    }
  }

  return compact(merge(base, props.options))
}

// drop undefined options so ApexCharts keeps its own defaults (e.g. labels: [])
function compact (value) {
  if (Array.isArray(value) || !value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, compact(v)])
  )
}

// plain-object deep merge: `options` overrides what is computed here
function merge (target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof target[key] === 'object' && target[key] && !Array.isArray(target[key])) {
      target[key] = merge({ ...target[key] }, value)
    } else {
      target[key] = value
    }
  }
  return target
}

async function render () {
  if (!el.value) return
  if (!ApexCharts) ApexCharts = (await import('apexcharts')).default
  if (!el.value) return
  if (chart) {
    await chart.updateOptions(buildOptions(), true, true)
    return
  }
  chart = new ApexCharts(el.value, buildOptions())
  await chart.render()
}

watch(
  () => [props.type, props.series, props.labels, props.colors, props.height, props.horizontal, props.stacked, props.options, props.totalLabel],
  () => render(),
  { deep: true }
)
// dark mode and the Entity's Theme repaint the chart
watch(() => $q.dark.isActive, () => render())
watch(() => User.Theme, () => render(), { deep: true })

onMounted(async () => {
  await nextTick()
  render()
})

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="s-chart" data-test="s-chart">
    <div ref="el" />
  </div>
</template>

<style>
.s-chart {
  width: 100%;
  min-width: 0;
}

.s-chart .apexcharts-tooltip {
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.s-chart .apexcharts-tooltip.apexcharts-theme-light {
  border-color: rgba(0, 0, 0, 0.06);
}

.s-chart .apexcharts-legend-text {
  font-weight: 500 !important;
}
</style>
