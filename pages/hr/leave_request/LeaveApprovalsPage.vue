<template>
  <q-page class="q-pa-sm">
    <s-card>
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
        <q-icon name="fact_check" size="22px" />
        <div class="text-subtitle1 text-weight-bold q-ml-sm">
          {{ tdc('Pending leave approvals') }}
        </div>
        <q-space />
        <q-badge color="white" text-color="primary">
          {{ LeaveRequest.pending.length }}
        </q-badge>
      </q-bar>

      <q-separator />

      <div v-if="LeaveRequest.loadingPending" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="42px" />
      </div>

      <div v-else-if="!LeaveRequest.pending.length" class="text-grey-6 q-pa-lg text-center">
        {{ tdc('No pending leave requests.') }}
      </div>

      <q-list v-else separator>
        <q-item v-for="request in LeaveRequest.pending" :key="request.id">
          <q-item-section>
            <q-item-label>
              {{ request.employee_data?.label || request.employee }}
              <span class="text-grey-7"> · {{ request.leave_type_data?.name }}</span>
            </q-item-label>
            <q-item-label caption>
              {{ request.start_date }} → {{ request.end_date }}
              ({{ request.days }} {{ tdc('day(s)') }})
            </q-item-label>
            <q-item-label caption v-if="request.reason">
              {{ request.reason }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row q-gutter-sm">
              <s-btn
                color="positive"
                icon="check"
                dense
                :label="tdc('Approve')"
                :loading="LeaveRequest.workflowLoading"
                @click="approve(request)"
              />
              <s-btn
                color="negative"
                icon="close"
                dense
                :label="tdc('Reject')"
                :loading="LeaveRequest.workflowLoading"
                @click="openReject(request)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </s-card>

    <!-- REJECT DIALOG -->
    <q-dialog v-model="rejectDialog">
      <s-card style="width: min(420px, 92vw);">
        <q-card-section>
          <div class="text-subtitle1">{{ tdc('Reject leave request') }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-input
            v-model="rejectionReason"
            outlined
            autogrow
            :label="tdc('Reason')"
            :error="rejectSubmitted && !rejectionReason"
            :error-message="tdc('A rejection reason is required.')"
          />
        </q-card-section>
        <q-card-actions align="right">
          <s-btn flat :label="tdc('Cancel')" v-close-popup />
          <s-btn
            color="negative"
            :label="tdc('Reject')"
            :loading="LeaveRequest.workflowLoading"
            @click="confirmReject"
          />
        </q-card-actions>
      </s-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLeaveRequestStore } from '../../../stores/LeaveRequestStore'
import { tdc } from '../../../services/translation'

const LeaveRequest = useLeaveRequestStore()

const rejectDialog = ref(false)
const rejectSubmitted = ref(false)
const rejectionReason = ref('')
const rejectTarget = ref(null)

async function approve(request) {
  await LeaveRequest.approve(request.id)
}

function openReject(request) {
  rejectTarget.value = request
  rejectionReason.value = ''
  rejectSubmitted.value = false
  rejectDialog.value = true
}

async function confirmReject() {
  rejectSubmitted.value = true
  if (!rejectionReason.value) return

  await LeaveRequest.reject(rejectTarget.value.id, rejectionReason.value)
  rejectDialog.value = false
}

onMounted(() => LeaveRequest.loadPending())
</script>
