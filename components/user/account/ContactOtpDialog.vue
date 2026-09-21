<script setup>
import { computed } from 'vue'

import OtpInput from '../../OtpInput.vue'
import { tdc } from '../../../services/translation'
import { maskContact } from '../../../utils/maskContact'

// "We sent a code to ..." - the confirmation step of an e-mail / phone change.
// Purely presentational: the flow (request, confirm, resend, states) is
// useContactOtp(), owned by the dialog that opens this one. The backend does
// not report when a code expires, so no countdown is shown (none is invented).
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  channel: { type: String, default: 'email' },
  identifier: { type: String, default: '' },
  otp: { type: String, default: '' },
  // idle | sending | sent | confirming | invalid | resending | success
  status: { type: String, default: 'sent' }
})

const emit = defineEmits(['update:modelValue', 'update:otp', 'confirm', 'resend', 'cancel'])

const isEmail = computed(() => props.channel === 'email')
const masked = computed(() => maskContact(props.channel, props.identifier))
const confirming = computed(() => props.status === 'confirming')
const resending = computed(() => props.status === 'resending')
const invalid = computed(() => props.status === 'invalid')
const locked = computed(() => confirming.value || resending.value)
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="value => emit('update:modelValue', value)"
    @keydown.esc="!locked && emit('cancel')"
  >
    <s-modal-card
      :title="isEmail ? tdc('Verify your email') : tdc('Verify your phone')"
      :icon="isEmail ? 'mail' : 'sms'"
      width="420px"
      :close-disable="locked"
      role="dialog"
      aria-modal="true"
      @close="emit('cancel')"
    >
      <div class="column items-center text-center">
        <div class="text-body2 text-grey-7">
          {{ tdc('We sent a 6-digit code to') }}
        </div>
        <div class="text-subtitle1 text-weight-medium" data-test="otp-target">{{ masked }}</div>
      </div>

      <div class="q-mt-md">
        <OtpInput
          :model-value="otp"
          :length="6"
          @update:model-value="value => emit('update:otp', value)"
          @complete="value => emit('confirm', value)"
        />

        <div
          v-if="invalid"
          class="row items-center justify-center text-negative text-caption q-mt-sm"
          role="alert"
          data-test="otp-invalid"
        >
          <q-icon name="error_outline" size="16px" class="q-mr-xs" />
          {{ tdc('Invalid or expired code') }}
        </div>
      </div>

      <div class="q-mt-md text-center">
        <div class="text-caption text-grey-7">{{ tdc("Didn't receive it?") }}</div>
        <s-btn
          flat
          dense
          no-caps
          color="primary"
          icon="refresh"
          :label="tdc('Resend code')"
          :loading="resending"
          :disable="confirming"
          data-test="otp-resend"
          @click="emit('resend')"
        />
      </div>

      <template #footer>
        <s-btn flat no-caps :label="tdc('Cancel')" :disable="locked" data-test="otp-cancel" @click="emit('cancel')" />
        <s-btn
          unelevated
          no-caps
          color="primary"
          :label="tdc('Confirm')"
          :loading="confirming"
          :disable="otp.length !== 6 || resending"
          data-test="otp-confirm"
          @click="emit('confirm', otp)"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>
