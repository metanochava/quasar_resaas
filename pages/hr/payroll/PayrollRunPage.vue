<template>
  <q-page class="q-pa-sm">
    <s-card>
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="col text-h6">{{ tdc('Payroll Run') }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="col">
          <s-select
            v-model="periodChoice"
            :options="periodOptions"
            emit-value
            map-options
            outlined
            dense
            :label="tdc('Payroll period')"
          />
        </div>
        <div class="col-auto">
          <s-btn
            color="primary"
            icon="play_circle"
            :label="tdc('Generate')"
            :loading="PayrollPeriod.generating"
            :disable="!periodChoice"
            @click="doGenerate"
          />
        </div>
      </q-card-section>

      <div v-if="genError" class="text-negative text-caption q-px-md q-pb-sm">{{ genError }}</div>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-lg">
        <q-spinner size="40px" color="primary" />
      </div>

      <div v-else-if="!rows.length" class="text-grey-6 q-pa-md">
        {{ tdc('No payrolls yet - pick a period and click Generate.') }}
      </div>

      <q-list v-else separator>
        <q-item v-for="row in rows" :key="row.id">
          <q-item-section>
            <q-item-label>{{ row.employee_data?.label || row.employee_data?.person_data?.full_name }}</q-item-label>
            <q-item-label caption>
              {{ tdc('Net salary') }}: {{ row.net_salary }}
              · {{ tdc('Earnings') }}: {{ row.total_earnings }}
              · {{ tdc('Deductions') }}: {{ row.total_deductions }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-badge :color="statusColor(row.status)">
              {{ row.status?.label || row.status }}
            </q-badge>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <s-btn
                v-if="statusValue(row) === 'calculated'"
                dense flat color="primary" :label="tdc('Review')"
                :loading="Payroll.actionLoading"
                @click="doAction(row, 'review')"
              />
              <s-btn
                v-if="statusValue(row) === 'reviewed'"
                dense flat color="grey-8" :label="tdc('Reopen')"
                :loading="Payroll.actionLoading"
                @click="doAction(row, 'reopen')"
              />
              <s-btn
                v-if="statusValue(row) === 'reviewed'"
                dense flat color="positive" :label="tdc('Confirm')"
                :loading="Payroll.actionLoading"
                @click="doAction(row, 'confirm')"
              />
              <s-btn
                v-if="statusValue(row) === 'confirmed'"
                dense flat color="primary" :label="tdc('Mark paid')"
                :loading="Payroll.actionLoading"
                @click="doAction(row, 'mark_paid')"
              />
              <s-btn
                v-if="['draft', 'calculated', 'reviewed'].includes(statusValue(row))"
                dense flat color="negative" icon="close"
                :loading="Payroll.actionLoading"
                @click="doAction(row, 'cancel')"
              >
                <q-tooltip>{{ tdc('Cancel') }}</q-tooltip>
              </s-btn>
              <s-btn
                v-if="row.payslip_id"
                dense flat round icon="picture_as_pdf"
                :href="payslipPdfUrl(row)"
                target="_blank"
              >
                <q-tooltip>{{ tdc('Payslip PDF') }}</q-tooltip>
              </s-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePayrollPeriodStore } from '../../../stores/PayrollPeriodStore.js'
import { usePayrollStore } from '../../../stores/PayrollStore.js'
import { HTTPAuth, url } from '../../../services/api'
import { tdc } from '../../../services/translation.js'

const PayrollPeriod = usePayrollPeriodStore()
const Payroll = usePayrollStore()

const periods = ref([])
const periodChoice = ref(null)
const rows = ref([])
const loading = ref(false)
const genError = ref('')

const periodOptions = computed(() =>
  (periods.value || []).map((p) => ({ label: p.name, value: p.id }))
)

function statusValue(row) {
  return row.status?.value || row.status
}

function statusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'confirmed':
    case 'paid': return 'positive'
    case 'cancelled': return 'grey-7'
    case 'reviewed': return 'warning'
    default: return 'primary'
  }
}

function payslipPdfUrl(row) {
  return url({ type: 'u', url: `hr/payslips/${row.payslip_id}/pdf/` })
}

async function loadPeriods() {
  const { data } = await HTTPAuth.get(
    url({ type: 'u', url: 'hr/payrollperiods/', params: { page_size: 100 } })
  )
  periods.value = data?.results ?? data ?? []
}

async function loadPayrollsForPeriod() {
  if (!periodChoice.value) {
    rows.value = []
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: 'hr/payrolls/', params: { period: periodChoice.value, page_size: 100 } })
    )
    rows.value = data?.results ?? data ?? []
  } finally {
    loading.value = false
  }
}

async function doGenerate() {
  genError.value = ''

  try {
    rows.value = await PayrollPeriod.generate(periodChoice.value)
  } catch (err) {
    genError.value = err?.response?.data?.detail || tdc('Could not generate payroll for this period.')
  }
}

async function doAction(row, action) {
  try {
    await Payroll[action === 'mark_paid' ? 'markPaid' : action](row.id)
    await loadPayrollsForPeriod()
  } catch (err) {
    genError.value = err?.response?.data?.detail || tdc('Could not update this payroll.')
  }
}

onMounted(async () => {
  await PayrollPeriod.init()
  await Payroll.init()
  await loadPeriods()
})
</script>
