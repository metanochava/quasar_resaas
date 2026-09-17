<script setup>
import { computed, onMounted, watch } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useDashboardStore } from '../../stores/DashboardStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'

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
  const fromEntity = User.Entity?.entity_type?.label || User.Entity?.entity_type?.name
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
const selected = computed(() => {
  if (!entityTypeName.value) return null
  const exists = Dashboard.dashboards.some((d) => d.name === entityTypeName.value)
  return exists ? entityTypeName.value : null
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
    <DashboardRenderer v-show="User.Entity?.dashboard?.value=='Auto'" :name="selected" />
    <DashboardComponent v-show="User.Entity?.dashboard?.value=='Manual'" />
  </div>
  
</template>