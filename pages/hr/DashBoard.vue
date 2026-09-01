<template>
  <q-page class="q-pa-md hr-dashboard">

    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold row items-center">
        <q-icon name="dashboard" size="28px" class="q-mr-sm text-primary" />
        {{ tdc('HR Dashboard') }}
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
          class="col-12 col-sm-6 col-md-4 col-lg-2"
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
                <div v-if="kpi.hint" class="text-caption text-grey-6">{{ kpi.hint }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>
      </div>

      <!-- CHARTS ROW 1 -->
      <div class="row q-col-gutter-md q-mb-md">

        <div class="col-12 col-md-7">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Employees by Department') }}
              </div>

              <div v-if="!byDepartment.length" class="text-caption text-grey-6">
                {{ tdc('No data') }}
              </div>

              <div v-for="(d, i) in byDepartment" :key="d.label" class="q-mb-sm">
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

        <div class="col-12 col-md-5">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc("Today's Attendance") }}
              </div>

              <div class="row items-center q-col-gutter-md">
                <div class="col-5">
                  <svg viewBox="0 0 42 42" class="donut-chart">
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(128,128,128,.15)" stroke-width="6" />
                    <circle
                      v-for="seg in attendanceDonut" :key="seg.label"
                      cx="21" cy="21" r="15.9"
                      fill="transparent"
                      :stroke="seg.color"
                      stroke-width="6"
                      stroke-linecap="round"
                      :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
                      :stroke-dashoffset="seg.dashoffset"
                    />
                    <text x="21" y="24" text-anchor="middle" class="donut-center">{{ attendanceTotal }}</text>
                  </svg>
                </div>
                <div class="col-7">
                  <div v-for="seg in attendanceDonut" :key="'l' + seg.label" class="row items-center q-mb-xs">
                    <div class="legend-dot" :style="{ background: seg.color }" />
                    <div class="text-caption q-ml-xs">{{ tdc(seg.label) }} — {{ seg.value }}</div>
                  </div>
                  <div v-if="!attendanceTotal" class="text-caption text-grey-6">
                    {{ tdc('No records for today') }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </s-card>
        </div>

      </div>

      <!-- CHARTS ROW 2 -->
      <div class="row q-col-gutter-md q-mb-md">

        <div class="col-12 col-md-5">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Contracts by Type') }}
              </div>

              <div class="row items-center q-col-gutter-md">
                <div class="col-5">
                  <svg viewBox="0 0 42 42" class="donut-chart">
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(128,128,128,.15)" stroke-width="6" />
                    <circle
                      v-for="seg in contractDonut" :key="seg.label"
                      cx="21" cy="21" r="15.9"
                      fill="transparent"
                      :stroke="seg.color"
                      stroke-width="6"
                      stroke-linecap="round"
                      :stroke-dasharray="`${seg.pct} ${100 - seg.pct}`"
                      :stroke-dashoffset="seg.dashoffset"
                    />
                    <text x="21" y="24" text-anchor="middle" class="donut-center">{{ contracts.length }}</text>
                  </svg>
                </div>
                <div class="col-7">
                  <div v-for="seg in contractDonut" :key="'l' + seg.label" class="row items-center q-mb-xs">
                    <div class="legend-dot" :style="{ background: seg.color }" />
                    <div class="text-caption q-ml-xs">{{ tdc(seg.label) }} — {{ seg.value }}</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-12 col-md-7">
          <s-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium q-mb-md">
                {{ tdc('Payroll by Status') }}
              </div>

              <div v-for="d in payrollByStatus" :key="d.label" class="q-mb-sm">
                <div class="row items-center justify-between text-caption q-mb-xs">
                  <span>{{ tdc(d.label) }}</span>
                  <span class="text-weight-medium">{{ d.value }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: d.pct + '%', background: d.color }" />
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

import { useEmployeeStore } from '../../stores/EmployeeStore'
import { useDepartmentStore } from '../../stores/DepartmentStore'
import { useAttendanceStore } from '../../stores/AttendanceStore'
import { usePayrollStore } from '../../stores/PayrollStore'
import { useContractStore } from '../../stores/ContractStore'

const router = useRouter()

const Employee = useEmployeeStore()
const Department = useDepartmentStore()
const Attendance = useAttendanceStore()
const Payroll = usePayrollStore()
const Contract = useContractStore()

const loading = ref(true)

const todayISO = new Date().toISOString().slice(0, 10)
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
    Employee.loadData({ page_size: 500 }),
    Department.loadData({ page_size: 200 }),
    Attendance.loadData({ page_size: 500 }),
    Payroll.loadData({ page_size: 500 }),
    Contract.loadData({ page_size: 500 })
  ])

  loading.value = false
})

const employees = computed(() => Employee.rows || [])
const activeEmployees = computed(() => employees.value.filter(e => !e.termination_date))
const contracts = computed(() => Contract.rows || [])

const departmentsTotal = computed(() => Department.pagination.rowsNumber || Department.rows.length)

const byDepartment = computed(() => {
  const counts = {}

  employees.value.forEach(e => {
    const name = e.position_data?.department_data?.name || tdc('No Department')
    counts[name] = (counts[name] || 0) + 1
  })

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = Math.max(1, ...entries.map(([, v]) => v))

  return entries.map(([label, value]) => ({
    label, value, pct: Math.round((value / max) * 100)
  }))
})

function buildDonut(items) {
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1
  let cumulative = 0

  return items.map(i => {
    const pct = (i.value / total) * 100
    const seg = { ...i, pct, dashoffset: 25 - cumulative }
    cumulative += pct
    return seg
  })
}

const attendanceToday = computed(() => Attendance.rows.filter(a => a.date === todayISO))
const attendanceTotal = computed(() => attendanceToday.value.length)
const presentToday = computed(() => attendanceToday.value.filter(a => a.status === 'present').length)
const lateToday = computed(() => attendanceToday.value.filter(a => a.status === 'late').length)
const absentToday = computed(() => attendanceToday.value.filter(a => a.status === 'absent').length)

const attendanceDonut = computed(() => buildDonut([
  { label: 'Present', value: presentToday.value, color: 'var(--q-positive)' },
  { label: 'Late', value: lateToday.value, color: 'var(--q-warning)' },
  { label: 'Absent', value: absentToday.value, color: 'var(--q-negative)' }
]))

const contractDonut = computed(() => {
  const counts = { full_time: 0, part_time: 0, temporary: 0 }
  contracts.value.forEach(c => { if (counts[c.contract_type] !== undefined) counts[c.contract_type]++ })

  return buildDonut([
    { label: 'Full Time', value: counts.full_time, color: 'var(--q-primary)' },
    { label: 'Part Time', value: counts.part_time, color: 'var(--q-info)' },
    { label: 'Temporary', value: counts.temporary, color: 'var(--q-accent)' }
  ])
})

const activeContracts = computed(() =>
  contracts.value.filter(c => !c.end_date || c.end_date >= todayISO).length
)

const payrollByStatus = computed(() => {
  const counts = {}
  Payroll.rows.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })

  const order = [
    { key: 'draft', label: 'Draft', color: 'rgba(128,128,128,.6)' },
    { key: 'processed', label: 'Processed', color: 'var(--q-info)' },
    { key: 'paid', label: 'Paid', color: 'var(--q-positive)' },
    { key: 'cancelled', label: 'Cancelled', color: 'var(--q-negative)' }
  ]

  const max = Math.max(1, ...order.map(o => counts[o.key] || 0))

  return order.map(o => ({
    label: o.label,
    value: counts[o.key] || 0,
    color: o.color,
    pct: Math.round(((counts[o.key] || 0) / max) * 100)
  }))
})

const payrollTotalNet = computed(() =>
  Payroll.rows
    .filter(p => p.status === 'paid' || p.status === 'processed')
    .reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
)

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value || 0)
}

const kpis = computed(() => [
  {
    label: 'Employees',
    value: Employee.pagination.rowsNumber || employees.value.length,
    hint: `${activeEmployees.value.length} ${tdc('active')}`,
    icon: 'groups', color: 'primary', route: 'list_employee'
  },
  {
    label: 'Departments',
    value: departmentsTotal.value,
    icon: 'apartment', color: 'secondary', route: 'list_department'
  },
  {
    label: 'Active Contracts',
    value: activeContracts.value,
    icon: 'description', color: 'accent', route: 'list_contract'
  },
  {
    label: "Today's Attendance",
    value: `${presentToday.value}/${attendanceTotal.value}`,
    hint: tdc('present'),
    icon: 'event_available', color: 'positive', route: 'list_attendance'
  },
  {
    label: 'Absences Today',
    value: absentToday.value,
    icon: 'event_busy', color: 'negative', route: 'list_attendance'
  },
  {
    label: 'Payroll (Paid/Processed)',
    value: formatCurrency(payrollTotalNet.value),
    icon: 'payments', color: 'info', route: 'list_payroll'
  }
])

const quickLinks = [
  { label: 'Employees', icon: 'groups', route: 'list_employee' },
  { label: 'Departments', icon: 'apartment', route: 'list_department' },
  { label: 'Job Positions', icon: 'badge', route: 'list_jobposition' },
  { label: 'Attendance', icon: 'event_available', route: 'list_attendance' },
  { label: 'Contracts', icon: 'description', route: 'list_contract' },
  { label: 'Payroll', icon: 'payments', route: 'list_payroll' }
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

.donut-chart {
  width: 100%;
}
.donut-center {
  font-size: 8px;
  font-weight: 700;
  fill: currentColor;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
