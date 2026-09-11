<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

// SVG à mão, sem biblioteca de charting (ver BarChartWidget.vue para a
// mesma justificação) - viewBox 0..100 em ambos os eixos, normalizado
// por série.
const chartColors = [
  'var(--q-primary)', 'var(--q-secondary)', 'var(--q-accent)',
  'var(--q-info)', 'var(--q-warning)', 'var(--q-positive)',
]

const labels = computed(() => props.data.labels || [])
const series = computed(() => props.data.series || [])

const maxValue = computed(() =>
  Math.max(1, ...series.value.flatMap((s) => s.data.map(Number)))
)

function points(values) {
  const n = Math.max(1, values.length - 1)
  return values
    .map((v, i) => {
      const x = (i / n) * 100
      const y = 100 - (Number(v) / maxValue.value) * 100
      return `${x},${y}`
    })
    .join(' ')
}

function areaPoints(values) {
  const n = Math.max(1, values.length - 1)
  const top = values.map((v, i) => {
    const x = (i / n) * 100
    const y = 100 - (Number(v) / maxValue.value) * 100
    return `${x},${y}`
  })
  return `0,100 ${top.join(' ')} 100,100`
}
</script>

<template>
  <div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart">
      <template v-if="widget.area">
        <polygon
          v-for="(s, si) in series" :key="`area-${s.name}`"
          :points="areaPoints(s.data)"
          :fill="chartColors[si % chartColors.length]"
          opacity="0.15"
        />
      </template>
      <polyline
        v-for="(s, si) in series" :key="s.name"
        :points="points(s.data)"
        fill="none"
        :stroke="chartColors[si % chartColors.length]"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <div class="row justify-between text-caption text-grey-6 q-mt-xs">
      <span v-for="label in labels" :key="label">{{ label }}</span>
    </div>

    <div v-if="series.length > 1" class="row q-gutter-md q-mt-sm">
      <div v-for="(s, si) in series" :key="s.name" class="row items-center q-gutter-xs">
        <div class="legend-dot" :style="{ background: chartColors[si % chartColors.length] }" />
        <span class="text-caption">{{ tdc(s.name) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-chart {
  width: 100%;
  height: 140px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
