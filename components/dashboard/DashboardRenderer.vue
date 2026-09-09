<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import DashboardHeader from './DashboardHeader.vue'
import DashboardFilters from './DashboardFilters.vue'
import WidgetContainer from './WidgetContainer.vue'

// Ponto de entrada único do motor - não conhece 'saude', 'hr', 'demo'
// nem nenhum módulo de negócio: só sabe pedir um dashboard pelo nome
// e desenhar os widgets que vierem já autorizados do backend.

const props = defineProps({
  name: { type: String, default: null },
})

const route = useRoute()
const Dashboard = useDashboardStore()

const dashboardName = computed(() =>
  props.name || route.params.dashboardName || route.meta?.dashboardName
)

const gutterClass = computed(() => {
  const gap = Dashboard.dashboard?.layout?.gap || 'md'
  return `q-col-gutter-${gap}`
})

const sortedWidgets = computed(() =>
  [...(Dashboard.dashboard?.widgets || [])].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  )
)

async function load() {
  if (!dashboardName.value) return

  Dashboard.reset()
  Dashboard.restoreFiltersFromQuery(route.query)

  await Dashboard.loadDashboard(dashboardName.value)
  if (Dashboard.dashboard) {
    await Dashboard.loadAllWidgets()
    Dashboard.startAutoRefresh()
  }
}

watch(dashboardName, load)

onMounted(load)
onUnmounted(() => Dashboard.reset())
</script>

<template>
  <q-page class="q-pa-sm">
    <div v-if="Dashboard.dashboardLoading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <div v-else-if="Dashboard.dashboardError" class="column flex-center q-pa-xl text-negative">
      <q-icon name="error_outline" size="32px" />
      <div class="text-body2 q-mt-sm">{{ Dashboard.dashboardError.message }}</div>
    </div>

    <template v-else-if="Dashboard.dashboard">
      <DashboardHeader />
      <DashboardFilters />

      <div v-if="sortedWidgets.length" class="row" :class="gutterClass">
        <WidgetContainer
          v-for="widget in sortedWidgets" :key="widget.name"
          :widget="widget"
        />
      </div>

      <div v-else class="text-caption text-grey-6 q-pa-md">
        {{ tdc('No widgets available') }}
      </div>
    </template>
  </q-page>
</template>
