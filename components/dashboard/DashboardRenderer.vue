<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import { useUserStore } from '../../stores/UserStore'
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
const User = useUserStore()

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

// DashboardDetailAPIView/widget endpoints filter by
// DashboardPermissionService against the CURRENT effective Group's
// permissions - switching profile via GroupSelector.vue's
// Group.select() changes User.Group without navigating away from
// here, so the config/widgets already shown must be reloaded too, not
// just re-fetched from scratch on a fresh mount.
//
// Watching User.Group?.id directly fires too early: Group.select() ->
// User.selectContext() sets User.Group synchronously FIRST, then only
// afterwards awaits refreshResaasContext() -> createResaasContext(),
// which POSTs resaas/context/ and only once THAT resolves calls
// setResaasContext() (services/tenantContext.js) to write the new
// signed token services/api.js's request interceptor actually reads
// (X-RESAAS-Context header) for every subsequent request. Firing load()
// on the Group?.id change would send its requests with the OLD
// context - watch User.ResaasContext (the token itself) instead, so
// load() only runs once the new context is the one actually sent.
watch(() => User.ResaasContext, load)

// Deliberately does NOT call User.refreshResaasContext() itself here
// (it briefly did - caused a burst of duplicate loads, see below).
// Nested under HomeDashboards.vue (the '/home' case), that parent
// already awaits its OWN refreshResaasContext() before this even
// mounts, and the watch(User.ResaasContext) above reacts to it
// reactively. Used standalone on its own dashboard route (dashboardName
// from route.params/route.meta, no parent doing this), a stale context
// still self-heals: ResaasContextService.decode() 403s with "RESAAS
// context has expired.", and services/api.js's response interceptor
// already refreshes it and retries that one request automatically
// (deduped via its own module-level contextRefreshPromise). Calling
// User.refreshResaasContext() directly here bypassed that dedup
// entirely (it's a different call site than the interceptor's), so
// nested under HomeDashboards.vue this fired its OWN independent
// refresh, changing User.ResaasContext a SECOND time (a fresh
// token every call), which re-triggered the watch(User.ResaasContext)
// above AND HomeDashboards.vue's own - each already-redundant call
// begetting another one after it, one duplicate load() per refresh
// site instead of a single clean one.
onMounted(load)
onUnmounted(() => Dashboard.reset())
</script>

<template>
  <q-page class="q-pa-sm">
    <div v-if="Dashboard.dashboardLoading" class="flex flex-center q-pa-xl">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
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
