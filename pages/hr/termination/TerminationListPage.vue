<template>
  <q-page class="q-pa-sm">
    <!-- Termination has no generic add page on purpose - see
    hr/views/termination.py (blocks a raw POST); creation only happens via
    EmployeeStore.terminateEmployee() from an Employee's profile. -->
    <s-card>
      <q-bar class="bg-primary text-white">
        <q-icon name="person_off" />
        <div class="text-subtitle1 q-ml-sm">{{ tdc('Terminations') }}</div>
      </q-bar>

      <q-card-section>
        <div v-if="Termination.loading" class="flex flex-center q-pa-lg">
          <q-spinner size="40px" color="primary" />
        </div>

        <div v-else-if="!Termination.rows?.length" class="text-grey-6 q-pa-md">
          {{ tdc('No terminations found.') }}
        </div>

        <q-list v-else separator>
          <q-item
            v-for="row in Termination.rows"
            :key="row.id"
            clickable
            :to="{ name: 'view_employee', params: { id: row.employee_data?.id || row.employee } }"
          >
            <q-item-section>
              <q-item-label>{{ row.employee_data?.label || row.employee }}</q-item-label>
              <q-item-label caption>
                {{ row.termination_type?.label || row.termination_type }} · {{ row.termination_date }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </s-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTerminationStore } from '../../../stores/TerminationStore.js'
import { tdc } from '../../../services/translation.js'

const Termination = useTerminationStore()

onMounted(async () => {
  await Termination.loadData({ page_size: 50 })
})
</script>
