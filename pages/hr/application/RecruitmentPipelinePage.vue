<template>
  <q-page class="q-pa-sm">
    <s-card class="q-mb-md">
      <q-card-section class="row q-col-gutter-md items-end">
        <div class="col-12 col-sm-6">
          <s-select
            v-model="selectedJobOpeningId"
            :options="jobOpeningOptions"
            emit-value
            map-options
            dense
            outlined
            :label="tdc('Job opening')"
            @update:model-value="onJobOpeningChange"
          />
        </div>
        <div class="col-12 col-sm-auto">
          <s-btn
            color="primary"
            icon="add"
            no-caps
            :label="tdc('New application')"
            :to="{ name: 'add_application' }"
          />
        </div>
      </q-card-section>
    </s-card>

    <div v-if="!selectedJobOpeningId" class="text-grey-6 q-pa-lg text-center">
      {{ tdc('Select a job opening to see its pipeline.') }}
    </div>

    <div v-else-if="Application.loadingPipeline" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="42px" />
    </div>

    <div v-else class="row q-col-gutter-sm pipeline-board">
      <div
        v-for="column in activeColumns"
        :key="column.status"
        class="col-12 col-sm-6 col-md pipeline-column"
      >
        <s-card>
          <q-card-section class="bg-grey-2 row items-center">
            <div class="text-weight-bold">{{ tdc(column.label) }}</div>
            <q-space />
            <q-badge color="primary">{{ byStatus[column.status]?.length || 0 }}</q-badge>
          </q-card-section>
          <q-separator />
          <q-list separator>
            <q-item v-if="!(byStatus[column.status] || []).length">
              <q-item-section class="text-grey-6 text-center q-pa-md">
                {{ tdc('Empty') }}
              </q-item-section>
            </q-item>
            <q-item v-for="application in byStatus[column.status] || []" :key="application.id">
              <q-item-section>
                <q-item-label>{{ application.candidate_data?.full_name }}</q-item-label>
                <q-item-label caption>{{ application.candidate_data?.email }}</q-item-label>

                <div class="row q-gutter-xs q-mt-xs">
                  <s-btn
                    v-if="column.status === 'applied'"
                    dense size="sm" color="primary" no-caps
                    :label="tdc('Screen')"
                    :loading="Application.workflowLoading"
                    @click="move(application, 'screening')"
                  />
                  <s-btn
                    v-if="column.status === 'screening'"
                    dense size="sm" color="primary" no-caps
                    :label="tdc('Shortlist')"
                    :loading="Application.workflowLoading"
                    @click="move(application, 'shortlisted')"
                  />
                  <s-btn
                    v-if="column.status === 'shortlisted' || column.status === 'interview'"
                    dense size="sm" color="secondary" no-caps
                    :label="tdc('Schedule interview')"
                    @click="openInterviewDialog(application)"
                  />
                  <s-btn
                    v-if="column.status === 'interview'"
                    dense size="sm" color="primary" no-caps
                    :label="tdc('Make offer')"
                    :loading="Application.workflowLoading"
                    @click="move(application, 'offered')"
                  />
                  <s-btn
                    v-if="column.status === 'offered'"
                    dense size="sm" color="positive" no-caps
                    :label="tdc('Hire')"
                    :loading="Application.workflowLoading"
                    @click="openHireDialog(application)"
                  />
                  <s-btn
                    v-if="!['offered'].includes(column.status)"
                    dense size="sm" flat color="negative" no-caps
                    :label="tdc('Reject')"
                    :loading="Application.workflowLoading"
                    @click="move(application, 'rejected')"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </s-card>
      </div>
    </div>

    <!-- CLOSED (terminal statuses) -->
    <s-card v-if="selectedJobOpeningId" class="q-mt-md">
      <q-card-section class="bg-grey-2 text-weight-bold">
        {{ tdc('Closed') }}
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item v-if="!closedApplications.length">
          <q-item-section class="text-grey-6 text-center q-pa-md">
            {{ tdc('No hired/rejected/withdrawn applications yet.') }}
          </q-item-section>
        </q-item>
        <q-item v-for="application in closedApplications" :key="application.id">
          <q-item-section>
            {{ application.candidate_data?.full_name }}
          </q-item-section>
          <q-item-section side>
            <q-chip
              dense
              :color="application.status?.value === 'hired' ? 'positive' : 'grey-6'"
              text-color="white"
            >
              {{ application.status?.label || application.status }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </s-card>

    <!-- SCHEDULE INTERVIEW DIALOG -->
    <q-dialog v-model="interviewDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('Schedule interview') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="interviewForm.scheduledAt"
            type="datetime-local"
            outlined
            dense
            :label="tdc('Date and time')"
          />
          <s-select
            v-model="interviewForm.interviewer"
            :options="employeeOptions"
            emit-value
            map-options
            clearable
            dense
            outlined
            :label="tdc('Interviewer')"
          />
          <s-select
            v-model="interviewForm.mode"
            :options="modeOptions"
            emit-value
            map-options
            dense
            outlined
            :label="tdc('Mode')"
          />
          <q-input
            v-model="interviewForm.notes"
            type="textarea"
            outlined
            dense
            :label="tdc('Notes')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat no-caps :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="primary"
            no-caps
            :label="tdc('Schedule')"
            :loading="Application.workflowLoading"
            @click="confirmScheduleInterview"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>

    <!-- HIRE CONFIRMATION DIALOG -->
    <q-dialog v-model="hireDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('Hire this candidate?') }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">
            {{ tdc('This creates a real Employee record and cannot be undone from here.') }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat no-caps :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="positive"
            no-caps
            :label="tdc('Confirm hire')"
            :loading="Application.workflowLoading"
            @click="confirmHire"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useJobOpeningStore } from '../../../stores/JobOpeningStore.js'
import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import { useApplicationStore } from '../../../stores/ApplicationStore.js'
import { tdc } from '../../../services/translation.js'
import { Alert } from '../../../boot/alerts.js'

const JobOpening = useJobOpeningStore()
const Employee = useEmployeeStore()
const Application = useApplicationStore()

const selectedJobOpeningId = ref(null)

const jobOpeningOptions = computed(() =>
  (JobOpening.rows || []).map(row => ({ label: row.title, value: row.id }))
)

const employeeOptions = computed(() =>
  (Employee.rows || []).map(row => ({
    label: row.person_data?.full_name || row.code,
    value: row.id,
  }))
)

const modeOptions = [
  { label: tdc('In person'), value: 'in_person' },
  { label: tdc('Video'), value: 'video' },
  { label: tdc('Phone'), value: 'phone' },
]

// The generic `move` action never targets these two (see hr/models/
// application.py MOVE_TARGETS) - interview is reached only via
// scheduleInterview(), hired only via hire(). "shortlisted"/"interview"
// both offer "Schedule interview" so a second interview round is possible.
const activeColumns = [
  { status: 'applied', label: 'Applied' },
  { status: 'screening', label: 'Screening' },
  { status: 'shortlisted', label: 'Shortlisted' },
  { status: 'interview', label: 'Interview' },
  { status: 'offered', label: 'Offered' },
]

const byStatus = computed(() => {
  const groups = {}
  for (const application of Application.pipeline || []) {
    const status = application.status?.value || application.status
    groups[status] ||= []
    groups[status].push(application)
  }
  return groups
})

const closedApplications = computed(() =>
  (Application.pipeline || []).filter(application => {
    const status = application.status?.value || application.status
    return ['hired', 'rejected', 'withdrawn'].includes(status)
  })
)

async function onJobOpeningChange(jobOpeningId) {
  if (!jobOpeningId) return
  await Application.loadPipeline(jobOpeningId)
}

async function move(application, targetStatus) {
  try {
    await Application.move(application.id, targetStatus)
    await Application.loadPipeline(selectedJobOpeningId.value)
  } catch (err) {
    Alert(err?.response)
  }
}

// ---------------- SCHEDULE INTERVIEW ----------------
const interviewDialog = ref(false)
const interviewTarget = ref(null)
const interviewForm = ref({ scheduledAt: '', interviewer: null, mode: 'in_person', notes: '' })

function openInterviewDialog(application) {
  interviewTarget.value = application
  interviewForm.value = { scheduledAt: '', interviewer: null, mode: 'in_person', notes: '' }
  interviewDialog.value = true
}

async function confirmScheduleInterview() {
  if (!interviewTarget.value || !interviewForm.value.scheduledAt) return

  try {
    await Application.scheduleInterview(interviewTarget.value.id, {
      scheduledAt: new Date(interviewForm.value.scheduledAt).toISOString(),
      interviewer: interviewForm.value.interviewer,
      mode: interviewForm.value.mode,
      notes: interviewForm.value.notes,
    })
    interviewDialog.value = false
    await Application.loadPipeline(selectedJobOpeningId.value)
  } catch (err) {
    Alert(err?.response)
  }
}

// ---------------- HIRE ----------------
const hireDialog = ref(false)
const hireTarget = ref(null)

function openHireDialog(application) {
  hireTarget.value = application
  hireDialog.value = true
}

async function confirmHire() {
  if (!hireTarget.value) return

  try {
    await Application.hire(hireTarget.value.id)
    hireDialog.value = false
    await Application.loadPipeline(selectedJobOpeningId.value)
  } catch (err) {
    Alert(err?.response)
  }
}

onMounted(async () => {
  await JobOpening.loadData({ page_size: 100 })
  await Employee.loadData({ page_size: 200 })
})
</script>

<style scoped>
.pipeline-board {
  flex-wrap: nowrap;
  overflow-x: auto;
}
.pipeline-column {
  min-width: 260px;
}
</style>
