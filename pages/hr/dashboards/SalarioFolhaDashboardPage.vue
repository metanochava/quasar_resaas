<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="payments" class="q-mr-xs" />
          {{ tdc('Salary & Payroll') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <template v-else>
        <q-card-section class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Open Periods') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.open_payroll_periods }}</div>
              </q-card-section>
            </s-card>
          </div>
          <div class="col-6 col-md-3">
            <s-card flat bordered>
              <q-card-section>
                <div class="text-caption text-grey-6">{{ tdc('Average Salary') }}</div>
                <div class="text-h5 text-weight-bold">{{ data.average_base_salary }}</div>
              </q-card-section>
            </s-card>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle2 text-weight-medium q-mb-sm">
            {{ tdc('Last Period') }}: {{ data.last_period_name || tdc('—') }}
          </div>
          <div class="text-caption text-grey-6">
            {{ tdc('Total Net Cost') }}: {{ data.last_period_total_net_cost ?? '—' }}
          </div>
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
  open_payroll_periods: 0,
  last_period_name: null,
  last_period_total_net_cost: null,
  average_base_salary: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_salario_folha',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>
