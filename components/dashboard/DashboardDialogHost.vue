<script setup>
// Renders the dialog opened by a dashboard "dialog" action
// (services/dashboardDialogs.js). One per DashboardRenderer.
import { computed } from 'vue'
import { useDashboardStore } from '../../stores/DashboardStore'
import { openDialog, closeDashboardDialog } from '../../services/dashboardDialogs'

const Dashboard = useDashboardStore()

const open = computed({
  get: () => !!openDialog.value,
  set: (value) => { if (!value) closeDashboardDialog() }
})

async function onSaved(payload) {
  const current = openDialog.value
  closeDashboardDialog()
  current?.onSaved?.(payload)
  // the record usually changes more than one widget (counters, queues)
  await Dashboard.loadAllWidgets()
}
</script>

<template>
  <component
    :is="openDialog.component"
    v-if="openDialog"
    v-model="open"
    :context="openDialog.context"
    :action="openDialog.action"
    data-test="dashboard-dialog"
    @saved="onSaved"
  />
</template>
