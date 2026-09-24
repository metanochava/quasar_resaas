<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useDashboardStore } from '../../stores/DashboardStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'
import { tdc } from '../../services/translation'

// User.Entity já fica populado logo a seguir ao login
// (UserStore.selectContext()/EntityStore.select_()) - Entity.entity_type
// vem serializado como {id,value,label} (RepresentationMixin trata
// toda FK assim), 'label' é o nome real do EntityType
// (EntityType.RESAAS.label_field = "name").
//
// EntityTypeStore.row é o registo actualmente aberto num ecrã de CRUD
// genérico (createBaseStore) - só fica preenchido quando um admin
// está a editar um EntityType, nunca automaticamente após o login;
// por isso a home ficava sem nenhum dashboard logo a seguir a entrar
// (row ainda vazio nesse momento). Mantido como segunda fonte
// (fallback), não removido - LoginPage.vue já o popula noutro
// contexto (marca da página de login antes de autenticar).
const User = useUserStore()
const TipoEntidade = useEntityTypeStore()
const Entidade = useEntityStore()
const Dashboard = useDashboardStore()

const entityTypeName = computed(() => {
  // userEntitys (the list the Entity is picked from) sends entity_type;
  // before it did it only sent the old key entityType, and an Entity saved
  // in localStorage by then still has only that one
  const type = User.Entity?.entity_type || User.Entity?.entityType
  const fromEntity = type?.label || type?.name
  const fromCrudRow = TipoEntidade.row?.name

  return (fromEntity || fromCrudRow || '').toLowerCase() || null
})

// Not every EntityType has its own <app>/dashboard.py (e.g. the
// generic/base "saas" tenant type) - rendering DashboardRenderer
// unconditionally by name sent a request straight into a backend
// dashboard_not_found error for any of those. Only use the dynamic
// engine when a dashboard actually exists (and is authorized) for
// this EntityType; DashboardComponent (the older custom-widget
// registry) stays the fallback otherwise, same as before this had a
// matching dashboard to render at all.
//
// A module can declare several dashboards (django_resaas: DASHBOARD +
// DASHBOARDS, e.g. saude's Reception/Nursing/Doctor). The list the backend
// returns is already filtered by module + permission, so every dashboard of
// this EntityType's module in it is one the user may open: they become
// tabs, the first by `order` being the default. Which ones a user gets is
// decided by permissions only - never by the profile's name.
const moduleDashboards = computed(() => {
  if (!entityTypeName.value) return []
  return Dashboard.dashboards
    .filter((d) => (d.module || d.name) === entityTypeName.value)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
})

// per-viewer convenience only (last tab picked); never required
const HOME_TAB_KEY = 'homeDashboardTab'
function readTab() {
  try { return localStorage.getItem(HOME_TAB_KEY) } catch { return null }
}
const chosen = ref(readTab())
watch(chosen, (name) => {
  try { name ? localStorage.setItem(HOME_TAB_KEY, name) : localStorage.removeItem(HOME_TAB_KEY) } catch { /* storage unavailable */ }
})

const selected = computed(() => {
  const list = moduleDashboards.value
  if (!list.length) return null
  return list.some((d) => d.name === chosen.value) ? chosen.value : list[0].name
})

// Always reload on mount - this only ever mounts on the 'home' route
// (<s-dashboard-home/> in IndexPage.vue), and the previous
// !Dashboard.dashboards.length guard meant the list (and by extension
// which dashboard - engine vs legacy registry - gets selected below)
// was only ever fetched once per SPA session, going stale on every
// subsequent visit to home after leaving and coming back.
//
// refreshResaasContext() runs FIRST and is awaited - the
// X-RESAAS-Context token (services/tenantContext.js) lives in
// sessionStorage, separately from User.Entity/Branch/Group
// (localStorage, restored by MainLayout.vue's beforeMount() before this
// even mounts). It can be missing/stale independently of them (a new
// tab, an expired token, ...), and nothing else re-establishes it on a
// fresh page load - every request (services/api.js's interceptor)
// until then goes out with the wrong/no tenant context, which is why a
// hard reload on '/home' showed no dashboard despite User.Entity itself
// being restored fine. Same call Group.select() already makes when
// switching profile mid-session (User.selectContext() ->
// refreshResaasContext()) - just also made once on a fresh mount here,
// sequenced before the fetch it gates rather than left to the
// watch(User.ResaasContext) below to catch reactively (which still
// exists for the profile-switch case, and may also fire once more from
// this same refresh - loadDashboardList() is idempotent, so a possible
// extra call is harmless).
onMounted(async () => {
  await User.refreshResaasContext()
  await Dashboard.loadDashboardList()
})

// DashboardListAPIView filters by DashboardPermissionService against
// the CURRENT effective Group's permissions - switching profile via
// GroupSelector.vue's Group.select() can change whether THIS EntityType's
// dashboard is even in that authorized list, so `selected` above must be
// re-derived from a fresh list, not the one fetched under the OLD
// profile (otherwise switching from a no-permission profile to a
// privileged one kept `selected` stuck at null - DashboardRenderer
// never even requested the module's data).
//
// Watching User.Group?.id directly would fire too early - see
// DashboardRenderer.vue's own watch for why: Group.select() ->
// User.selectContext() sets User.Group synchronously BEFORE awaiting
// refreshResaasContext(), which only then POSTs resaas/context/ and
// writes the token services/api.js's request interceptor actually
// sends. Watch User.ResaasContext (the token itself) instead, so this
// only re-fetches once the new context is the one actually in use.
watch(() => User.ResaasContext, () => {
  Dashboard.loadDashboardList()
})
</script>

<template>
    
  <div v-if="Dashboard.dashboardsLoading" class="flex flex-center q-pa-xl">
    <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
  </div>

  <div v-else class="flex flex-center q-pa-xs">
    <div v-show="User.Entity?.dashboard?.value=='Auto'" class="full-width">
      <q-tabs
        v-if="moduleDashboards.length > 1"
        :model-value="selected"
        dense
        inline-label
        outside-arrows
        mobile-arrows
        align="left"
        class="q-mb-sm"
        data-test="home-dashboard-tabs"
        @update:model-value="chosen = $event"
      >
        <q-tab
          v-for="d in moduleDashboards"
          :key="d.name"
          :name="d.name"
          :icon="d.icon || undefined"
          :label="tdc(d.label)"
        />
      </q-tabs>
      <DashboardRenderer :key="selected" :name="selected" />
    </div>
    <DashboardComponent v-show="User.Entity?.dashboard?.value=='Manual'" />
  </div>
  
</template>