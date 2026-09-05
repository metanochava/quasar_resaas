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

      <!-- FASE 10: LEAVE / RECRUITMENT / ONBOARDING / PERFORMANCE -->
      <div class="row q-col-gutter-md q-mb-md">

        <div v-if="available.leave" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'leave_approvals' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="warning" text-color="white" icon="event_busy" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Pending Leave') }}</div>
                <div class="text-h6 text-weight-bold">{{ pendingLeaveCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div v-if="available.recruitment" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_jobopening' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="secondary" text-color="white" icon="work" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Open Job Openings') }}</div>
                <div class="text-h6 text-weight-bold">{{ openJobOpeningsCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div v-if="available.recruitment" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_application' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="accent" text-color="white" icon="people_alt" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Candidates in Pipeline') }}</div>
                <div class="text-h6 text-weight-bold">{{ activePipelineCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div v-if="available.onboarding" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_employeeonboarding' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="info" text-color="white" icon="checklist" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Onboarding In Progress') }}</div>
                <div class="text-h6 text-weight-bold">{{ onboardingInProgressCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div v-if="available.performance" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_performancereview' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="primary" text-color="white" icon="insights" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Reviews Due') }}</div>
                <div class="text-h6 text-weight-bold">{{ reviewsDueCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div v-if="available.training" class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="negative" text-color="white" icon="verified" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Certifications Expiring (30d)') }}</div>
                <div class="text-h6 text-weight-bold">{{ expiringCertificationsCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

      </div>

      <!-- FASE 10: EMPLOYEE LIFECYCLE (ultimos 30 dias) -->
      <div v-if="available.lifecycle" class="row q-col-gutter-md q-mb-md">

        <div class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_promotion' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="positive" text-color="white" icon="trending_up" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Promotions (30d)') }}</div>
                <div class="text-h6 text-weight-bold">{{ recentPromotionsCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_transfer' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="info" text-color="white" icon="swap_horiz" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Transfers (30d)') }}</div>
                <div class="text-h6 text-weight-bold">{{ recentTransfersCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_termination' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="grey-7" text-color="white" icon="person_remove" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Terminations (30d)') }}</div>
                <div class="text-h6 text-weight-bold">{{ recentTerminationsCount }}</div>
              </div>
            </q-card-section>
          </s-card>
        </div>

        <div class="col-6 col-sm-3 col-lg-2">
          <s-card flat bordered class="kpi-card cursor-pointer" @click="router.push({ name: 'list_disciplinarycase' })">
            <q-card-section class="row items-center no-wrap">
              <q-avatar color="negative" text-color="white" icon="gavel" size="42px" class="q-mr-md" />
              <div>
                <div class="text-caption text-grey-7">{{ tdc('Open Disciplinary Cases') }}</div>
                <div class="text-h6 text-weight-bold">{{ openDisciplinaryCount }}</div>
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
import { useLeaveRequestStore } from '../../stores/LeaveRequestStore'
import { useJobOpeningStore } from '../../stores/JobOpeningStore'
import { useApplicationStore } from '../../stores/ApplicationStore'
import { useEmployeeOnboardingStore } from '../../stores/EmployeeOnboardingStore'
import { usePerformanceReviewStore } from '../../stores/PerformanceReviewStore'
import { useCertificationStore } from '../../stores/CertificationStore'
import { usePromotionStore } from '../../stores/PromotionStore'
import { useTransferStore } from '../../stores/TransferStore'
import { useTerminationStore } from '../../stores/TerminationStore'
import { useDisciplinaryCaseStore } from '../../stores/DisciplinaryCaseStore'

const router = useRouter()

const Employee = useEmployeeStore()
const Department = useDepartmentStore()
const Attendance = useAttendanceStore()
const Payroll = usePayrollStore()
const Contract = useContractStore()
const LeaveRequest = useLeaveRequestStore()
const JobOpening = useJobOpeningStore()
const Application = useApplicationStore()
const EmployeeOnboarding = useEmployeeOnboardingStore()
const PerformanceReview = usePerformanceReviewStore()
const Certification = useCertificationStore()
const Promotion = usePromotionStore()
const Transfer = useTransferStore()
const Termination = useTerminationStore()
const DisciplinaryCase = useDisciplinaryCaseStore()

const loading = ref(true)

// Fase 10: cada dominio (Fases 3-9) e carregado a parte, com
// Promise.allSettled - se o grupo do utilizador nao tiver a permissao
// view_<model> de um dominio, o backend devolve erro (BaseAPIView ja
// filtra por tenant+permissao) e essa seccao e simplesmente omitida,
// em vez de partir o dashboard inteiro. Nao ha nenhum "gate" de
// permissao decidido no frontend - so reage ao que o backend permitiu.
const available = ref({
  leave: false,
  recruitment: false,
  onboarding: false,
  performance: false,
  training: false,
  lifecycle: false
})

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

  const [
    leaveRes, jobRes, appRes, onboardRes,
    reviewRes, certRes, promoRes, transferRes, termRes, discRes
  ] = await Promise.allSettled([
    LeaveRequest.loadData({ status: 'pending', page_size: 200 }),
    JobOpening.loadData({ status: 'open', page_size: 200 }),
    Application.loadData({ page_size: 500 }),
    EmployeeOnboarding.loadData({ status: 'in_progress', page_size: 200 }),
    PerformanceReview.loadData({ status: 'draft', page_size: 200 }),
    Certification.loadData({ page_size: 500 }),
    Promotion.loadData({ page_size: 200 }),
    Transfer.loadData({ page_size: 200 }),
    Termination.loadData({ page_size: 200 }),
    DisciplinaryCase.loadData({ status: 'open', page_size: 200 })
  ])

  available.value.leave = leaveRes.status === 'fulfilled'
  available.value.recruitment = jobRes.status === 'fulfilled' && appRes.status === 'fulfilled'
  available.value.onboarding = onboardRes.status === 'fulfilled'
  available.value.performance = reviewRes.status === 'fulfilled'
  available.value.training = certRes.status === 'fulfilled'
  available.value.lifecycle = (
    promoRes.status === 'fulfilled' &&
    transferRes.status === 'fulfilled' &&
    termRes.status === 'fulfilled' &&
    discRes.status === 'fulfilled'
  )

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

// Fase 10: metricas das Fases 3-9 - cada uma so e mostrada quando o
// respectivo `available.*` e true (ver Promise.allSettled em onMounted).
const soonISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const pendingLeaveCount = computed(() => LeaveRequest.pagination.rowsNumber || LeaveRequest.rows.length)

const openJobOpeningsCount = computed(() => JobOpening.pagination.rowsNumber || JobOpening.rows.length)
const activePipelineCount = computed(() =>
  Application.rows.filter(a => !['hired', 'rejected', 'withdrawn'].includes(a.status)).length
)

const onboardingInProgressCount = computed(() => EmployeeOnboarding.pagination.rowsNumber || EmployeeOnboarding.rows.length)

const reviewsDueCount = computed(() => PerformanceReview.pagination.rowsNumber || PerformanceReview.rows.length)

const expiringCertificationsCount = computed(() =>
  Certification.rows.filter(c => c.expires_at && c.expires_at <= soonISO).length
)

const recentPromotionsCount = computed(() =>
  Promotion.rows.filter(p => p.effective_date >= sinceISO).length
)
const recentTransfersCount = computed(() =>
  Transfer.rows.filter(t => t.effective_date >= sinceISO).length
)
const recentTerminationsCount = computed(() =>
  Termination.rows.filter(t => t.termination_date >= sinceISO).length
)
const openDisciplinaryCount = computed(() => DisciplinaryCase.pagination.rowsNumber || DisciplinaryCase.rows.length)

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
  { label: 'Payroll', icon: 'payments', route: 'list_payroll' },
  { label: 'Leave Approvals', icon: 'event_busy', route: 'leave_approvals' },
  { label: 'Job Openings', icon: 'work', route: 'list_jobopening' },
  { label: 'Applications', icon: 'people_alt', route: 'list_application' },
  { label: 'Onboarding', icon: 'checklist', route: 'list_employeeonboarding' },
  { label: 'Performance Reviews', icon: 'insights', route: 'list_performancereview' },
  { label: 'Promotions', icon: 'trending_up', route: 'list_promotion' },
  { label: 'Transfers', icon: 'swap_horiz', route: 'list_transfer' },
  { label: 'Terminations', icon: 'person_remove', route: 'list_termination' },
  { label: 'Disciplinary Cases', icon: 'gavel', route: 'list_disciplinarycase' }
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
