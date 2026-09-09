<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { useDashboardStore } from '../../stores/DashboardStore'

const Dashboard = useDashboardStore()

const dashboard = computed(() => Dashboard.dashboard)

const lastUpdated = computed(() => {
  const values = Object.values(Dashboard.lastUpdated)
  if (!values.length) return null
  return new Date(Math.max(...values)).toLocaleTimeString()
})

const anyLoading = computed(() =>
  Object.values(Dashboard.widgetLoading).some(Boolean)
)
</script>

<template>
  <div v-if="dashboard" class="row items-center justify-between q-mb-md">
    <div class="row items-center q-gutter-sm">
      <q-icon v-if="dashboard.icon" :name="dashboard.icon" size="28px" color="primary" />
      <div class="text-h6 text-weight-bold">{{ tdc(dashboard.label) }}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <div v-if="lastUpdated" class="text-caption text-grey-6">
        {{ tdc('Updated') }}: {{ lastUpdated }}
      </div>
      <q-btn
        flat dense round icon="refresh" :loading="anyLoading"
        @click="Dashboard.loadAllWidgets()"
      />
    </div>
  </div>
</template>
