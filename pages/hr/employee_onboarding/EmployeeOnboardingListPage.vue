<template>
  <q-page class="q-pa-sm">
    <!-- EmployeeOnboarding has no generic add page on purpose - it's only
    ever created through EmployeeStore.startOnboarding() from a specific
    Employee's profile (Onboarding tab), never a free "Add" button here -
    see hr/views/employee_onboarding.py, which blocks a raw POST outright.
    This page is a browsing/overview list only (pedido secção 31/77). -->
    <s-card>
      <q-bar class="bg-primary text-white">
        <q-icon name="assignment_turned_in" />
        <div class="text-subtitle1 q-ml-sm">{{ tdc('Employee Onboardings') }}</div>
      </q-bar>

      <q-card-section>
        <div v-if="Onboarding.loading" class="flex flex-center q-pa-lg">
          <q-spinner size="40px" color="primary" />
        </div>

        <div v-else-if="!Onboarding.rows?.length" class="text-grey-6 q-pa-md">
          {{ tdc('No onboardings found.') }}
        </div>

        <q-list v-else separator>
          <q-item
            v-for="row in Onboarding.rows"
            :key="row.id"
            clickable
            :to="{ name: 'view_employee', params: { id: row.employee_data?.id || row.employee } }"
          >
            <q-item-section>
              <q-item-label>{{ row.employee_data?.label || row.employee }}</q-item-label>
              <q-item-label caption>
                {{ tdc('Started') }} {{ row.started_at ? row.started_at.slice(0, 10) : '-' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-linear-progress
                  :value="(row.progress || 0) / 100"
                  color="primary"
                  style="width: 120px"
                  rounded
                  size="8px"
                />
                <span class="text-caption">{{ row.progress || 0 }}%</span>
                <q-badge :color="statusColor(row.status)">
                  {{ row.status?.label || row.status }}
                </q-badge>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </s-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useEmployeeOnboardingStore } from '../../../stores/EmployeeOnboardingStore.js'
import { tdc } from '../../../services/translation.js'

const Onboarding = useEmployeeOnboardingStore()

function statusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'in_progress': return 'warning'
    case 'cancelled': return 'grey-7'
    default: return 'grey-5'
  }
}

onMounted(async () => {
  await Onboarding.loadData({ page_size: 50 })
})
</script>
