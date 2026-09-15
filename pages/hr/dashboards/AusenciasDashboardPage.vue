<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="beach_access" class="q-mr-xs" />
          {{ tdc('Absences') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <template v-else>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-6">
            <s-card flat bordered class="border-warning">
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Pending Approvals') }}</div>
                <div class="text-h5 text-weight-bold text-warning">{{ data.pending_approvals }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Requests This Month') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.leave_requests_this_month }}</div>
              </q-card-section>
            </s-card>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ tdc('Lowest Balances') }}
          </div>
          <div v-if="!data.lowest_balances.length" class="text-caption text-grey-6">
            {{ tdc('No data') }}
          </div>
          <q-list v-else separator>
            <q-item v-for="item in data.lowest_balances" :key="item.employee_id">
              <q-item-section>{{ item.employee__person__full_name || '—' }}</q-item-section>
              <q-item-section side>
                <q-badge :color="item.balance < 0 ? 'negative' : 'grey'">{{ item.balance }}</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </template>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { tdc } from '../../../services/translation'
import { HTTPAuth, url } from '../../../services/api'

const loading = ref(true)
const data = ref({
  pending_approvals: 0,
  leave_requests_this_month: 0,
  lowest_balances: [],
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_ausencias',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.border-warning {
  border-color: var(--q-warning) !important;
}
</style>
