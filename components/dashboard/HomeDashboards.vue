<script setup>
import { computed, onMounted } from 'vue'

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
onMounted(() => {
  Dashboard.loadDashboardList()
})

// Switching profile via GroupSelector.vue's Group.select() only changes
// User.Group's permissions, never User.Entity/entity_type - so
// `selected` (which dashboard MODULE applies) never changes on that
// switch, only what's authorized WITHIN it. Re-fetching the list here
// would call django_resaas/dashboards/ (no module) on every profile
// switch for no reason - DashboardRenderer.vue's own watch on
// User.Group already reloads the actual per-module endpoint
// (django_resaas/dashboard/<modulo>/) that matters.
</script>

<template>
    
  <div v-if="Dashboard.dashboardsLoading" class="flex flex-center q-pa-xl">
    <q-spinner color="primary" size="48px" />
  </div>

  <div v-else class="flex flex-center q-pa-xs">

{{ User.Entidade}} || {{ User.Entidade?.dashboard}}
    <DashboardRenderer v-show="User.Entidade?.dashboard?.value=='Auto'" :name="selected" />
    <DashboardComponent v-show="User.Entidade?.dashboard?.value=='Manual'" />
  </div>
  
</template>