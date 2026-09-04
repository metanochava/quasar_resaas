<template>
  <q-page class="q-pa-sm">
    <div v-if="Employee.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>

    <template v-else-if="employee">
      <!-- HEADER -->
      <s-card class="q-mb-md">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-avatar size="72px">
              <img :src="photoUrl" />
            </q-avatar>
          </div>

          <div class="col">
            <div class="text-h6">{{ fullName }}</div>
            <div class="text-subtitle2 text-grey-8">
              {{ positionLabel }}
              <span v-if="departmentLabel"> · {{ departmentLabel }}</span>
            </div>
            <div class="text-caption text-grey-6">
              {{ branchLabel }}
              <span v-if="employee.code"> · {{ employee.code }}</span>
            </div>
          </div>

          <div class="col-auto">
            <q-badge :color="statusColor" class="q-pa-sm text-weight-bold">
              {{ statusLabel }}
            </q-badge>
          </div>

          <div class="col-auto">
            <s-btn
              flat
              round
              icon="edit"
              :to="{ name: 'change_employee', params: { id: employee.id } }"
            >
              <q-tooltip>{{ tdc('Edit') }}</q-tooltip>
            </s-btn>
          </div>
        </q-card-section>
      </s-card>

      <!-- TABS -->
      <s-card>
        <q-tabs
          v-model="tab"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
        >
          <q-tab name="personal" :label="tdc('Personal')" />
          <q-tab name="employment" :label="tdc('Employment')" />
          <q-tab name="contract" :label="tdc('Contract')" />
          <q-tab name="attendance" :label="tdc('Attendance')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- PERSONAL -->
          <q-tab-panel name="personal">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Full name') }}</div>
                <div class="text-body1">{{ fullName || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Gender') }}</div>
                <div class="text-body1">{{ person?.gender || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Date of birth') }}</div>
                <div class="text-body1">{{ person?.date_of_birth || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Nationality') }}</div>
                <div class="text-body1">{{ person?.nationality || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Email') }}</div>
                <div class="text-body1">{{ person?.email || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Phone') }}</div>
                <div class="text-body1">{{ person?.phone || '-' }}</div>
              </div>
            </div>
          </q-tab-panel>

          <!-- EMPLOYMENT -->
          <q-tab-panel name="employment">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Employee number') }}</div>
                <div class="text-body1">{{ employee.code || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Status') }}</div>
                <div class="text-body1">{{ statusLabel }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Employment type') }}</div>
                <div class="text-body1">{{ employmentTypeLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Hire date') }}</div>
                <div class="text-body1">{{ employee.hire_date || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Department') }}</div>
                <div class="text-body1">{{ departmentLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Position') }}</div>
                <div class="text-body1">{{ positionLabel || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Job grade') }}</div>
                <div class="text-body1">{{ employee.job_grade_data?.name || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Manager') }}</div>
                <div class="text-body1">{{ employee.manager_data?.label || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Work email') }}</div>
                <div class="text-body1">{{ employee.work_email || '-' }}</div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7">{{ tdc('Work phone') }}</div>
                <div class="text-body1">{{ employee.work_phone || '-' }}</div>
              </div>
            </div>
          </q-tab-panel>

          <!-- CONTRACT -->
          <q-tab-panel name="contract">
            <div v-if="Employee.loadingContracts" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <div v-else-if="!contracts.length" class="text-grey-6 q-pa-md">
              {{ tdc('No contracts found for this employee.') }}
            </div>

            <q-list v-else separator>
              <q-item v-for="contract in contracts" :key="contract.id">
                <q-item-section>
                  <q-item-label>
                    {{ contract.contract_number || contract.contract_type }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ contract.start_date }} → {{ contract.end_date || tdc('ongoing') }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="grey-7">
                    {{ contract.status?.label || contract.status || '-' }}
                  </q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- ATTENDANCE -->
          <q-tab-panel name="attendance">
            <div class="row items-center q-mb-md q-gutter-sm">
              <s-btn
                v-if="!todayAttendance?.check_in"
                color="positive"
                icon="login"
                :label="tdc('Check in')"
                :loading="Employee.checkingInOut"
                @click="doCheckIn"
              />
              <s-btn
                v-else-if="!todayAttendance?.check_out"
                color="negative"
                icon="logout"
                :label="tdc('Check out')"
                :loading="Employee.checkingInOut"
                @click="doCheckOut"
              />
              <q-badge v-else color="positive" class="q-pa-sm">
                {{ tdc('Checked out today') }}
              </q-badge>
            </div>

            <div v-if="Employee.loadingAttendances" class="flex flex-center q-pa-lg">
              <q-spinner size="30px" color="primary" />
            </div>

            <div v-else-if="!attendances.length" class="text-grey-6 q-pa-md">
              {{ tdc('No attendance records found for this employee.') }}
            </div>

            <q-list v-else separator>
              <q-item v-for="record in attendances" :key="record.id">
                <q-item-section>
                  <q-item-label>{{ record.date }}</q-item-label>
                  <q-item-label caption>
                    {{ formatTime(record.check_in) }} → {{ formatTime(record.check_out) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-gutter-xs items-center">
                    <q-badge v-if="record.late_minutes" color="warning">
                      {{ tdc('Late') }} {{ record.late_minutes }}m
                    </q-badge>
                    <q-badge v-if="record.overtime_minutes" color="orange">
                      {{ tdc('Overtime') }} {{ record.overtime_minutes }}m
                    </q-badge>
                    <q-badge v-if="record.early_departure_minutes" color="grey-7">
                      {{ tdc('Early') }} {{ record.early_departure_minutes }}m
                    </q-badge>
                    <q-badge :color="attendanceStatusColor(record.status)">
                      {{ record.status?.label || record.status }}
                    </q-badge>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </s-card>
    </template>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeStore } from '../../../stores/EmployeeStore'
import { tdc } from '../../../services/translation'

const route = useRoute()
const Employee = useEmployeeStore()

const tab = ref('personal')

const employee = computed(() => Employee.row)
const person = computed(() => employee.value?.person_data)

const fullName = computed(() =>
  person.value?.full_name || [person.value?.name, person.value?.surname].filter(Boolean).join(' ')
)

const photoUrl = computed(() =>
  person.value?.profile?.url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
)

const positionLabel = computed(() => employee.value?.position_data?.title || tdc('No position'))
const departmentLabel = computed(() => employee.value?.position_data?.department_data?.name || '')
const branchLabel = computed(() => employee.value?.branch?.name || employee.value?.branch_data?.name || '')

const employmentTypeLabel = computed(() => {
  const value = employee.value?.employment_type
  return value?.label || value || ''
})

const statusValue = computed(() => {
  const value = employee.value?.employment_status
  return value?.value || value || (employee.value?.termination_date ? 'terminated' : 'active')
})

const statusLabel = computed(() => {
  const value = employee.value?.employment_status
  return value?.label || value || (employee.value?.termination_date ? tdc('Terminated') : tdc('Active'))
})

const statusColor = computed(() => {
  switch (statusValue.value) {
    case 'active': return 'positive'
    case 'probation': return 'warning'
    case 'suspended': return 'orange'
    case 'terminated':
    case 'resigned':
    case 'retired': return 'grey-7'
    default: return 'primary'
  }
})

const contracts = computed(() => Employee.contracts || [])
const attendances = computed(() => Employee.attendances || [])

const todayAttendance = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return attendances.value.find((record) => record.date === today) || null
})

function formatTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function attendanceStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'present': return 'positive'
    case 'late': return 'warning'
    case 'absent': return 'negative'
    default: return 'grey-7'
  }
}

async function doCheckIn() {
  await Employee.checkIn(employee.value.id)
}

async function doCheckOut() {
  await Employee.checkOut(employee.value.id)
}

async function load(id) {
  if (!id) return
  await Employee.getById(id, { force: true })
  await Employee.loadContracts(id)
}

// Attendance history is only fetched the first time that tab is opened -
// not part of the initial profile payload (pedido secção 70: load on
// demand, not one giant API call).
watch(tab, (value) => {
  if (value === 'attendance' && employee.value?.id) {
    Employee.loadAttendances(employee.value.id)
  }
})

onMounted(() => load(route.params.id))

watch(() => route.params.id, (id) => load(id))
</script>
