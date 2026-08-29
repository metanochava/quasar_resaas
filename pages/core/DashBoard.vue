<template>
  <q-page class="q-pa-md core-dashboard">

    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold row items-center">
        <q-icon name="admin_panel_settings" size="28px" class="q-mr-sm text-primary" />
        {{ tdc('Access Control Dashboard') }}
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
          class="col-12 col-sm-6 col-md-3"
        >
          <s-card
            flat bordered
            class="kpi-card cursor-pointer"
            @click="router.push({ name: kpi.route })"
          >
            <q-card-section class="row items-center no-wrap">
              <q-avatar :color="kpi.color" text-color="white" :icon="kpi.icon" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc(kpi.label) }}</div>
                <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>
      </div>

      <!-- CONTEXT + CHART ROW -->
      <div class="row q-col-gutter-md q-mb-md">

        <div class="col-12 col-md-5">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Current Context') }}
              </div>

              <div class="row items-center q-mb-sm">
                <q-icon name="business" size="20px" class="q-mr-sm text-primary" />
                <span class="text-caption text-grey-7 q-mr-xs">{{ tdc('Entity') }}:</span>
                <span class="text-weight-medium">{{ User.Entity?.name || tdc('None') }}</span>
              </div>

              <div class="row items-center q-mb-sm">
                <q-icon name="account_tree" size="20px" class="q-mr-sm text-secondary" />
                <span class="text-caption text-grey-7 q-mr-xs">{{ tdc('Branch') }}:</span>
                <span class="text-weight-medium">{{ User.Branch?.name || tdc('None') }}</span>
              </div>

              <div class="row items-center q-mb-sm">
                <q-icon name="groups" size="20px" class="q-mr-sm text-accent" />
                <span class="text-caption text-grey-7 q-mr-xs">{{ tdc('Group') }}:</span>
                <span class="text-weight-medium">{{ User.Group?.name || tdc('None') }}</span>
              </div>

              <div class="row items-center">
                <q-icon name="verified_user" size="20px" class="q-mr-sm text-positive" />
                <span class="text-caption text-grey-7 q-mr-xs">{{ tdc('Granted Permissions') }}:</span>
                <span class="text-weight-medium">{{ User.Permissions.size }}</span>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-12 col-md-7">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Permissions by App') }}
              </div>

              <div v-if="!permissionsByApp.length" class="text-caption text-grey-6">
                {{ tdc('No data') }}
              </div>

              <div v-for="(d, i) in permissionsByApp" :key="d.label" class="q-mb-sm">
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
          <div class="row q-col-gutter-sm">
            <q-btn
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

import { useBranchStore } from '../../stores/BranchStore'
import { useGroupStore } from '../../stores/GroupStore'
import { usePermissionStore } from '../../stores/PermissionStore'
import { useUserStore } from '../../stores/UserStore'

const router = useRouter()

const Branch = useBranchStore()
const Group = useGroupStore()
const Permission = usePermissionStore()
const User = useUserStore()

const loading = ref(true)

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

const chartColors = [
  'var(--q-primary)', 'var(--q-secondary)', 'var(--q-accent)',
  'var(--q-info)', 'var(--q-warning)', 'var(--q-positive)'
]

onMounted(async () => {
  loading.value = true

  await Promise.all([
    User.loadData({ page_size: 500 }),
    Group.loadData({ page_size: 200 }),
    Permission.loadData({ page_size: 1000 }),
    Branch.loadData({ page_size: 200 })
  ])

  loading.value = false
})

const permissionsByApp = computed(() => {
  const counts = {}

  Permission.rows.forEach(p => {
    const label = p.content_type?.label || ''
    const [app] = label.split('|').map(s => s.trim())
    const name = app || tdc('No App')
    counts[name] = (counts[name] || 0) + 1
  })

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = Math.max(1, ...entries.map(([, v]) => v))

  return entries.map(([label, value]) => ({
    label, value, pct: Math.round((value / max) * 100)
  }))
})

const kpis = computed(() => [
  {
    label: 'Users',
    value: User.pagination.rowsNumber || User.rows.length,
    icon: 'group', color: 'primary', route: 'list_user'
  },
  {
    label: 'Groups',
    value: Group.pagination.rowsNumber || Group.rows.length,
    icon: 'groups', color: 'secondary', route: 'list_group'
  },
  {
    label: 'Permissions',
    value: Permission.pagination.rowsNumber || Permission.rows.length,
    icon: 'security', color: 'accent', route: 'list_permission'
  },
  {
    label: 'Branches',
    value: Branch.pagination.rowsNumber || Branch.rows.length,
    icon: 'account_tree', color: 'info', route: 'list_branch'
  }
])

const quickLinks = [
  { label: 'Users', icon: 'group', route: 'list_user' },
  { label: 'Add User', icon: 'person_add', route: 'add_user' },
  { label: 'Groups', icon: 'groups', route: 'list_group' },
  { label: 'Add Group', icon: 'add', route: 'add_group' },
  { label: 'Permissions', icon: 'security', route: 'list_permission' },
  { label: 'Branches', icon: 'account_tree', route: 'list_branch' }
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
