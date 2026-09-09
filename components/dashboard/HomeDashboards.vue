<script setup>
// Home automática do motor de dashboards dinâmicos - pensada para
// substituir/complementar <s-dashboard/> (DashboardComponent.vue) na
// página inicial (front/src/pages/IndexPage.vue).
//
// "Automática" aqui significa: nenhuma lógica por tipo de entidade
// escrita à mão. GET /api/django_resaas/dashboards/ já devolve só os
// dashboards cujo módulo está activo PARA A ENTITY ACTUAL (EntityApp,
// resolvida a partir do X-RESAAS-Context que HTTPAuth já envia em
// cada pedido) e cuja permissão o utilizador actual cumpre - ver
// DashboardListAPIView em django_resaas.engine.core.dashboards.views.
// Se amanhã uma Entity de tipo "Clínica" activa saude+farmacia e uma
// de tipo "Loja" activa só sales, esta página mostra exactamente o
// que cada uma tem direito a ver, sem nenhum `if entityType === ...`
// aqui - a "consciência de tipo de entidade" vive inteiramente no
// backend (EntityApp), como manda CLAUDE.md #57 (dashboard nunca
// hardcoded por persona/tipo).
//
// Nunca fica em branco: se nenhum módulo tiver <app>/dashboard.py
// activo+autorizado para este utilizador/entity, cai no mecanismo
// antigo (<s-dashboard/> / DashboardComponent.vue - registerDashboard()
// client-side), preservando o comportamento actual da home tal e
// qual - nada deixa de funcionar para quem ainda não tem nenhum
// dashboard.py.

import { computed, onMounted, ref } from 'vue'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'

const Dashboard = useDashboardStore()

const loading = ref(true)
const selected = ref(null)

onMounted(async () => {
  await Dashboard.loadDashboardList()

  if (Dashboard.dashboards.length) {
    selected.value = Dashboard.dashboards[0].name
  }

  loading.value = false
})

const hasEngineDashboards = computed(() => Dashboard.dashboards.length > 0)
const showTabs = computed(() => Dashboard.dashboards.length > 1)
</script>

<template>
  <div v-if="loading" class="flex flex-center q-pa-xl">
    <q-spinner color="primary" size="48px" />
  </div>

  <template v-else-if="hasEngineDashboards">
    <q-tabs
      v-if="showTabs"
      v-model="selected"
      dense no-caps align="left"
      class="q-mb-sm text-primary" active-color="primary" indicator-color="primary"
    >
      <q-tab
        v-for="dashboard in Dashboard.dashboards" :key="dashboard.name"
        :name="dashboard.name" :icon="dashboard.icon" :label="tdc(dashboard.label)"
      />
    </q-tabs>

    <DashboardRenderer :name="selected" />
  </template>

  <DashboardComponent v-else />
</template>
