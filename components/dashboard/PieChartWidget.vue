<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

// Mesmo contrato {labels, series} de bar_chart/line_chart (pedido:
// "usa estrutura equivalente") - um pie só tem sentido com uma série
// (as fatias SÃO as categorias), por isso usa-se só series[0].
const chartColors = [
  'var(--q-primary)', 'var(--q-secondary)', 'var(--q-accent)',
  'var(--q-info)', 'var(--q-warning)', 'var(--q-positive)', 'var(--q-negative)',
]

const values = computed(() => (props.data.series || [])[0]?.data || [])
const total = computed(() => values.value.reduce((sum, v) => sum + Number(v), 0) || 1)

const slices = computed(() => {
  let cursor = 0
  return (props.data.labels || []).map((label, i) => {
    const value = Number(values.value[i]) || 0
    const pct = (value / total.value) * 100
    const slice = { label, value, pct, start: cursor, color: chartColors[i % chartColors.length] }
    cursor += pct
    return slice
  })
})

const gradient = computed(() =>
  `conic-gradient(${slices.value.map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(', ')})`
)

const isDonut = computed(() => props.widget.donut !== false)
</script>

<template>
  <div class="row items-center q-gutter-md">
    <div class="pie" :style="{ background: gradient }">
      <div v-if="isDonut" class="pie-hole" />
    </div>

    <div class="col column q-gutter-xs">
      <div v-for="slice in slices" :key="slice.label" class="row items-center justify-between text-caption">
        <div class="row items-center q-gutter-xs">
          <div class="legend-dot" :style="{ background: slice.color }" />
          <span>{{ tdc(slice.label) }}</span>
        </div>
        <span class="text-weight-medium">{{ slice.value }} ({{ slice.pct.toFixed(0) }}%)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pie {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}
.pie-hole {
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: #fff;
}
body.body--dark .pie-hole {
  background: var(--q-dark-page, #1d1d1d);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
