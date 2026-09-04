<template>
  <q-page class="q-pa-sm">
    <s-card>
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="col text-h6">{{ tdc('Training Sessions') }}</div>
        <div class="col-auto">
          <s-btn
            color="primary"
            icon="add"
            :label="tdc('New session')"
            :to="{ name: 'add_trainingsession' }"
          />
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="TrainingSession.loading" class="flex flex-center q-pa-lg">
        <q-spinner size="40px" color="primary" />
      </div>

      <div v-else-if="!TrainingSession.rows?.length" class="text-grey-6 q-pa-md">
        {{ tdc('No training sessions found.') }}
      </div>

      <q-list v-else separator>
        <q-item
          v-for="session in TrainingSession.rows"
          :key="session.id"
          clickable
          @click="openSession(session)"
        >
          <q-item-section>
            <q-item-label>
              {{ session.course_data?.label || session.course_data?.name }}
              <q-badge :color="statusColor(session.status)" class="q-ml-sm">
                {{ session.status?.label || session.status }}
              </q-badge>
            </q-item-label>
            <q-item-label caption>
              {{ formatDate(session.start_date) }} → {{ formatDate(session.end_date) }}
              <span v-if="session.location"> · {{ session.location }}</span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-badge color="grey-7" class="q-pa-sm">
              {{ session.enrolled_count || 0 }}<span v-if="session.capacity"> / {{ session.capacity }}</span>
              {{ tdc('enrolled') }}
            </q-badge>
          </q-item-section>

          <q-item-section side>
            <s-btn flat round dense icon="edit" :to="{ name: 'change_trainingsession', params: { id: session.id } }" @click.stop />
          </q-item-section>
        </q-item>
      </q-list>
    </s-card>

    <!-- ENROLLMENTS DIALOG -->
    <q-dialog v-model="sessionDialog">
      <s-card style="width: min(560px, 94vw);">
        <q-bar>
          <div class="text-subtitle2">
            {{ selectedSession?.course_data?.label || selectedSession?.course_data?.name }}
          </div>
          <q-space />
          <s-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <s-select
              v-model="enrollEmployeeChoice"
              :options="employeeOptions"
              emit-value
              map-options
              outlined
              dense
              :label="tdc('Enroll employee')"
            />
          </div>
          <div class="col-auto">
            <s-btn
              color="primary"
              icon="person_add"
              :loading="TrainingSession.enrollmentActionLoading"
              :disable="!enrollEmployeeChoice"
              @click="doEnroll"
            />
          </div>
        </q-card-section>

        <div v-if="enrollError" class="text-negative text-caption q-px-md">{{ enrollError }}</div>

        <q-separator />

        <div v-if="TrainingSession.loadingEnrollments" class="flex flex-center q-pa-lg">
          <q-spinner size="30px" color="primary" />
        </div>

        <div v-else-if="!TrainingSession.enrollments.length" class="text-grey-6 q-pa-md">
          {{ tdc('No one enrolled yet.') }}
        </div>

        <q-list v-else separator>
          <q-item v-for="enrollment in TrainingSession.enrollments" :key="enrollment.id">
            <q-item-section>
              <q-item-label>{{ enrollment.employee_data?.label }}</q-item-label>
              <q-item-label caption v-if="enrollment.score">
                {{ tdc('Score') }}: {{ enrollment.score }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <q-badge :color="enrollmentStatusColor(enrollment.status)">
                  {{ enrollment.status?.label || enrollment.status }}
                </q-badge>
                <template v-if="['enrolled', 'attending'].includes(enrollment.status?.value || enrollment.status)">
                  <s-btn
                    flat dense round icon="check_circle" color="positive"
                    :loading="TrainingSession.enrollmentActionLoading"
                    @click="doMarkCompleted(enrollment)"
                  >
                    <q-tooltip>{{ tdc('Mark completed') }}</q-tooltip>
                  </s-btn>
                  <s-btn
                    flat dense round icon="cancel" color="negative"
                    :loading="TrainingSession.enrollmentActionLoading"
                    @click="doMarkFailed(enrollment)"
                  >
                    <q-tooltip>{{ tdc('Mark failed') }}</q-tooltip>
                  </s-btn>
                </template>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </s-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingSessionStore } from '../../../stores/TrainingSessionStore.js'
import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import { tdc } from '../../../services/translation.js'

const route = useRoute()
const TrainingSession = useTrainingSessionStore()
const Employee = useEmployeeStore()

const sessionDialog = ref(false)
const selectedSession = ref(null)
const enrollEmployeeChoice = ref(null)
const enrollError = ref('')

const employeeOptions = computed(() =>
  (Employee.rows || []).map((row) => ({
    label: row.person_data?.full_name || row.code,
    value: row.id,
  }))
)

function formatDate(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function statusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'ongoing': return 'warning'
    case 'cancelled': return 'grey-7'
    default: return 'primary'
  }
}

function enrollmentStatusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'completed': return 'positive'
    case 'failed':
    case 'dropped': return 'negative'
    case 'attending': return 'warning'
    default: return 'grey-7'
  }
}

async function openSession(session) {
  selectedSession.value = session
  enrollEmployeeChoice.value = null
  enrollError.value = ''
  sessionDialog.value = true

  if (!Employee.rows?.length) {
    await Employee.loadData({ page_size: 100 })
  }

  await TrainingSession.loadEnrollments(session.id)
}

async function doEnroll() {
  enrollError.value = ''

  try {
    await TrainingSession.enroll(selectedSession.value.id, enrollEmployeeChoice.value)
    enrollEmployeeChoice.value = null
  } catch (err) {
    enrollError.value = err?.response?.data?.detail || tdc('Could not enroll this employee.')
  }
}

async function doMarkCompleted(enrollment) {
  await TrainingSession.markCompleted(selectedSession.value.id, enrollment.id)
}

async function doMarkFailed(enrollment) {
  await TrainingSession.markFailed(selectedSession.value.id, enrollment.id)
}

onMounted(async () => {
  await TrainingSession.init()
  await TrainingSession.loadData({ page_size: 100 })

  const sessionId = route.query.session
  if (sessionId) {
    const session = (TrainingSession.rows || []).find((row) => String(row.id) === String(sessionId))
    if (session) await openSession(session)
  }
})
</script>
