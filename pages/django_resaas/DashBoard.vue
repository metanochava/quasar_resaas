<template>
  <q-page class="q-pa-md django-resaas-dashboard">

    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold row items-center">
        <q-icon name="dashboard" size="28px" class="q-mr-sm text-primary" />
        {{ tdc('Tenancy Dashboard') }}
      </div>
      <div class="text-caption text-grey-7">{{ todayLabel }}</div>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <template v-else>

      <!-- KPI CARDS -->
      <div class="row q-col-gutter-md q-mb-md">
        <div
          v-for="kpi in kpis" :key="kpi.label"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <s-card
            flat bordered
            class="kpi-card cursor-pointer"
            @click="kpi.route && router.push({ name: kpi.route, query: kpi.query })"
          >
            <q-card-section class="row items-center no-wrap">
              <q-avatar :color="kpi.color" text-color="white" :icon="kpi.icon" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc(kpi.label) }}</div>
                <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
                <div v-if="kpi.hint" class="text-caption text-grey-6">{{ kpi.hint }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="row q-col-gutter-md q-mb-md">

        <div class="col-12 col-md-6">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Entities by Type') }}
              </div>

              <div v-if="!byEntityType.length" class="text-caption text-grey-6">
                {{ tdc('No data') }}
              </div>

              <div v-for="(d, i) in byEntityType" :key="d.label" class="q-mb-sm">
                <div class="row items-center justify-between text-caption q-mb-xs">
                  <span>{{ d.label }}</span>
                  <span class="text-weight-medium">{{ d.value }}</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: d.pct + '%', background: chartColors[i % chartColors.length] }"
                  />
                </div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-12 col-md-6">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Registered Apps') }}
              </div>

              <div v-if="!byApp.length" class="text-caption text-grey-6">
                {{ tdc('No apps registered') }}
              </div>

              <div v-for="(d, i) in byApp" :key="d.label" class="q-mb-sm">
                <div class="row items-center justify-between text-caption q-mb-xs">
                  <span>{{ d.label }}</span>
                  <span class="text-weight-medium">{{ d.value }}</span>
                </div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: d.pct + '%', background: chartColors[i % chartColors.length] }"
                  />
                </div>
              </div>
            </q-card-section>
          </s-card>
        </div>

      </div>

      <!-- QUICK ACCESS -->
      <s-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ tdc('Quick Access') }}</div>
          <div class="row q-gutter-sm">
            <s-btn
              v-for="link in quickLinks" :key="link.route"
              outline no-caps color="primary"
              :icon="link.icon" :label="tdc(link.label)"
              @click="router.push({ name: link.route })"
            />
          </div>
        </q-card-section>
      </s-card>

    </template>
  </q-page>
</template>

<script setup>

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

import { useBranchStore } from '../../stores/BranchStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useUserStore } from '../../stores/UserStore'

const router = useRouter()

const Branch = useBranchStore()
const Entity = useEntityStore()
const EntityType = useEntityTypeStore()
const User = useUserStore()

const loading = ref(true)
const apps = ref([])

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

const chartColors = [
  'var(--q-primary)', 'var(--q-secondary)', 'var(--q-accent)',
  'var(--q-info)', 'var(--q-warning)', 'var(--q-positive)'
]

async function loadApps() {
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} }))
    apps.value = data?.apps || []
  } catch (e) {
    console.error('loadApps error', e)
  }
}

onMounted(async () => {
  loading.value = true

  await Promise.all([
    Entity.loadData({ page_size: 500 }),
    EntityType.loadData({ page_size: 200 }),
    Branch.loadData({ page_size: 200 }),
    User.loadData({ page_size: 500 }),
    loadApps()
  ])

  loading.value = false
})

const entities = computed(() => Entity.rows || [])

function buildBars(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = Math.max(1, ...entries.map(([, v]) => v))

  return entries.map(([label, value]) => ({
    label, value, pct: Math.round((value / max) * 100)
  }))
}

const byEntityType = computed(() => {
  const counts = {}

  entities.value.forEach(e => {
    const name = (typeof e.entity_type === 'object' && e.entity_type?.name) || tdc('No Type')
    counts[name] = (counts[name] || 0) + 1
  })

  return buildBars(counts)
})

const byApp = computed(() => {
  const counts = {}
  apps.value.forEach(a => { counts[a.name] = a.models || 0 })
  return buildBars(counts)
})

const kpis = computed(() => [
  {
    label: 'Entities',
    value: Entity.pagination.rowsNumber || entities.value.length,
    icon: 'business', color: 'primary', route: 'list_entity'
  },
  {
    label: 'Entity Types',
    value: EntityType.pagination.rowsNumber || EntityType.rows.length,
    icon: 'category', color: 'secondary', route: 'list_entitytype'
  },
  {
    label: 'Branches',
    value: Branch.pagination.rowsNumber || Branch.rows.length,
    icon: 'account_tree', color: 'accent', route: 'list_branch'
  },
  {
    label: 'Users',
    value: User.pagination.rowsNumber || User.rows.length,
    icon: 'group', color: 'info', route: 'list_user'
  },
  {
    label: 'Registered Apps',
    value: apps.value.length,
    icon: 'widgets', color: 'positive', route: 'view_scaffold'
  }
])

const quickLinks = [
  { label: 'Entities', icon: 'business', route: 'list_entity' },
  { label: 'Entity Types', icon: 'category', route: 'list_entitytype' },
  { label: 'Branches', icon: 'account_tree', route: 'list_branch' },
  { label: 'Users', icon: 'group', route: 'list_user' },
  { label: 'Modules', icon: 'widgets', route: 'view_scaffold' },
  { label: 'Add App', icon: 'add', route: 'add_app' }
]

</script>

<style scoped>
.kpi-card {
  transition: transform var(--anim-speed, .2s) ease, box-shadow var(--anim-speed, .2s) ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .08);
}

.bar-track {
  height: 10px;
  border-radius: 6px;
  background: rgba(128, 128, 128, .15);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width .4s ease;
}
</style>
