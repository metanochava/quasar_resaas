<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

// Sem biblioteca de charting instalada no projecto (nenhuma dependência
// nova foi adicionada) - mesmo padrão já usado em
// pages/django_resaas/DashBoard.vue (barras CSS simples,
// var(--q-primary) etc., dark-mode-safe por herdar as CSS vars do tema
// Quasar actual).
const chartColors = [
  'var(--q-primary)', 'var(--q-secondary)', 'var(--q-accent)',
  'var(--q-info)', 'var(--q-warning)', 'var(--q-positive)', 'var(--q-negative)',
]

const series = computed(() => props.data.series || [])

const maxValue = computed(() => {
  if (props.widget.stacked) {
    return Math.max(
      1,
      ...(props.data.labels || []).map((_, i) =>
        series.value.reduce((sum, s) => sum + (Number(s.data[i]) || 0), 0)
      )
    )
  }
  return Math.max(1, ...series.value.flatMap((s) => s.data.map(Number)))
})

function pct(value) {
  return Math.min(100, (Number(value) / maxValue.value) * 100)
}
</script>

<template>
  <div>
    <div
      v-for="(label, i) in data.labels"
      :key="label"
      class="q-mb-sm"
    >
      <div class="row items-center justify-between text-caption q-mb-xs">
        <span>{{ label }}</span>
        <span class="text-weight-medium">
          {{ series.map((s) => s.data[i]).join(' / ') }}
        </span>
      </div>

      <div v-if="widget.stacked" class="bar-track row no-wrap">
        <q-tooltip
          v-for="(s, si) in series" :key="s.name"
        >
          {{ tdc(s.name) }}: {{ s.data[i] }}
        </q-tooltip>
        <div
          v-for="(s, si) in series" :key="s.name"
          class="bar-fill"
          :style="{ width: pct(s.data[i]) + '%', background: chartColors[si % chartColors.length] }"
        />
      </div>

      <div v-else class="column q-gutter-xs">
        <q-tooltip
          v-for="(s, si) in series" :key="s.name"
        >
          {{ tdc(s.name) }}: {{ s.data[i] }}
        </q-tooltip>
        <div v-for="(s, si) in series" :key="s.name" class="bar-track">
          <div
            class="bar-fill"
            :style="{ width: pct(s.data[i]) + '%', background: chartColors[si % chartColors.length] }"
          />
        </div>
      </div>
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
.bar-track {
  height: 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, .15);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  transition: width .4s ease;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
