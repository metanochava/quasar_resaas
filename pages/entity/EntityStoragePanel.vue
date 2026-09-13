<template>
  <s-card class="entity-panel storage-panel">
    <div
      class="panel-header"
      :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
    >
      <q-icon name="donut_large" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Storage') }}
      </div>
      <q-space />
    </div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner size="32px" color="primary" />
    </div>

    <q-card-section v-else class="q-pa-md">
      <div class="row items-center q-col-gutter-md">
        <div class="col-5 chart-col">
          <div class="chart-shell">
            <canvas ref="canvasEl" />
            <div class="chart-center">
              <div class="text-h6 text-weight-bold">{{ totalHuman.value }}</div>
              <div class="text-caption text-grey">{{ totalHuman.unit }}</div>
            </div>
          </div>
        </div>

        <div class="col-7">
          <div
            v-if="!breakdown.length"
            class="text-caption text-grey text-center q-pa-md"
          >
            <q-icon name="cloud_off" size="28px" class="q-mb-xs" />
            <div>{{ tdc('No files uploaded yet.') }}</div>
          </div>

          <div v-else class="q-gutter-xs">
            <div
              v-for="(item, index) in breakdown"
              :key="item.category"
              class="row items-center legend-row"
            >
              <div
                class="legend-dot"
                :style="{ background: palette[index % palette.length] }"
              />
              <div class="col text-caption q-ml-xs">{{ item.category }}</div>
              <div class="text-caption text-weight-medium">{{ humanSize(item.bytes) }}</div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </s-card>
</template>


<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  Tooltip
} from 'chart.js'

import { useEntityStore } from '../../stores/EntityStore'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

Chart.register(ArcElement, DoughnutController, Tooltip, Legend)

const props = defineProps({
  entityId: [String, Number]
})

const Entity = useEntityStore()

const loading = ref(false)
const totalBytes = ref(0)
const breakdown = ref([])
const canvasEl = ref(null)

let chart = null

const palette = ['#1976d2', '#26a69a', '#f2c037', '#ef5350', '#7e57c2', '#8d6e63']

function humanSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const totalHuman = computed(() => {
  const formatted = humanSize(totalBytes.value)
  const [value, unit] = formatted.split(' ')
  return { value, unit }
})

async function load() {
  if (!props.entityId) return

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `${Entity.safeUrl}/${props.entityId}/storage/` })
    )

    totalBytes.value = data?.total_bytes || 0
    breakdown.value = data?.breakdown || []

    await nextTick()
    renderChart()
  } finally {
    loading.value = false
  }
}

function renderChart() {
  if (!canvasEl.value) return

  if (chart) {
    chart.destroy()
    chart = null
  }

  const labels = breakdown.value.length ? breakdown.value.map(b => b.category) : [tdc('Empty')]
  const data = breakdown.value.length ? breakdown.value.map(b => b.bytes) : [1]
  const colors = breakdown.value.length
    ? breakdown.value.map((_, i) => palette[i % palette.length])
    : ['#e0e0e0']

  chart = new Chart(canvasEl.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      cutout: '72%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: breakdown.value.length > 0,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${humanSize(ctx.raw)}`
          }
        }
      }
    }
  })
}

watch(() => props.entityId, load)
onMounted(load)
onBeforeUnmount(() => { chart?.destroy() })
</script>


<style scoped>
.entity-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}

.chart-col {
  display: flex;
  justify-content: center;
}

.chart-shell {
  position: relative;
  width: 140px;
  height: 140px;
}

.chart-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  line-height: 1.1;
}

.legend-row {
  padding: 2px 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}
</style>
