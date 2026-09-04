<template>
  <q-page class="q-pa-sm">
    <s-card class="q-mb-md">
      <q-card-section class="row q-col-gutter-md items-end">
        <div class="col-12 col-sm-3">
          <q-input v-model="filters.employee" dense outlined clearable :label="tdc('Employee')" />
        </div>
        <div class="col-12 col-sm-3">
          <s-select
            v-model="filters.leave_type"
            :options="leaveTypeOptions"
            emit-value
            map-options
            clearable
            dense
            outlined
            :label="tdc('Leave type')"
          />
        </div>
        <div class="col-12 col-sm-2">
          <s-select
            v-model="filters.status"
            :options="statusOptions"
            emit-value
            map-options
            clearable
            dense
            outlined
            :label="tdc('Status')"
          />
        </div>
        <div class="col-6 col-sm-2">
          <q-input v-model="filters.from" type="date" dense outlined :label="tdc('From')" />
        </div>
        <div class="col-6 col-sm-2">
          <q-input v-model="filters.to" type="date" dense outlined :label="tdc('To')" />
        </div>
      </q-card-section>
    </s-card>

    <div v-if="LeaveRequest.loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="42px" />
    </div>

    <div v-else-if="!groupedByMonth.length" class="text-grey-6 q-pa-lg text-center">
      {{ tdc('No leave requests found for these filters.') }}
    </div>

    <s-card v-for="group in groupedByMonth" :key="group.month" class="q-mb-md">
      <q-card-section class="bg-grey-2 text-weight-bold">
        {{ group.label }}
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item v-for="request in group.items" :key="request.id">
          <q-item-section>
            <q-item-label>
              {{ request.employee_data?.label || request.employee }}
              <span class="text-grey-7"> · {{ request.leave_type_data?.name }}</span>
            </q-item-label>
            <q-item-label caption>
              {{ request.start_date }} → {{ request.end_date }}
              ({{ request.days }} {{ tdc('day(s)') }})
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="statusColor(request.status)">
              {{ request.status?.label || request.status }}
            </q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useLeaveRequestStore } from '../../../stores/LeaveRequestStore'
import { useLeaveTypeStore } from '../../../stores/LeaveTypeStore'
import { tdc } from '../../../services/translation'

const LeaveRequest = useLeaveRequestStore()
const LeaveType = useLeaveTypeStore()

const filters = reactive({
  employee: '',
  leave_type: null,
  status: null,
  from: '',
  to: '',
})

const statusOptions = [
  { label: tdc('Draft'), value: 'draft' },
  { label: tdc('Pending'), value: 'pending' },
  { label: tdc('Approved'), value: 'approved' },
  { label: tdc('Rejected'), value: 'rejected' },
  { label: tdc('Cancelled'), value: 'cancelled' },
]

const leaveTypeOptions = computed(() =>
  (LeaveType.rows || []).map((row) => ({ label: row.name, value: row.id }))
)

function statusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'approved': return 'positive'
    case 'pending': return 'warning'
    case 'rejected': return 'negative'
    case 'cancelled': return 'grey-7'
    default: return 'grey-5'
  }
}

// Server-side filtering only covers exact-match fields (DynamicFilterBackend
// auto-generates ?field=value, no date-range lookups - see
// core/base/views.py). The from/to date range is applied client-side on
// the already-fetched page; a large-scale "browse years of history"
// report is Fase 10 (Reports), not this calendar view.
async function load() {
  await LeaveRequest.loadData({
    page_size: 200,
    search: filters.employee || undefined,
    leave_type: filters.leave_type || undefined,
    status: filters.status || undefined,
  })
}

const filteredRows = computed(() => {
  return (LeaveRequest.rows || []).filter((request) => {
    if (filters.from && request.start_date < filters.from) return false
    if (filters.to && request.end_date > filters.to) return false
    return true
  })
})

const groupedByMonth = computed(() => {
  const groups = {}

  filteredRows.value.forEach((request) => {
    const month = (request.start_date || '').slice(0, 7) // "YYYY-MM"
    if (!groups[month]) groups[month] = []
    groups[month].push(request)
  })

  return Object.keys(groups)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((month) => ({
      month,
      label: month
        ? new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
        : tdc('Unknown month'),
      items: groups[month],
    }))
})

watch(() => [filters.leave_type, filters.status, filters.employee], load)

onMounted(async () => {
  await LeaveType.loadData({ page_size: 100 })
  await load()
})
</script>
