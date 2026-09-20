<script setup>
import { ref, computed, watch } from 'vue'

import ContactOtpDialog from './ContactOtpDialog.vue'
import { useContactOtp } from '../../../composables/useContactOtp'
import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'
import { AlertSuccess } from '../../../boot/alerts'

// New e-mail -> code sent to the NEW address -> confirm. The account's e-mail
// only changes once the backend accepts the code (useContactOtp).
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'changed'])

const Session = useUserStore()
const flow = useContactOtp()

const newEmail = ref('')

const normalised = computed(() => newEmail.value.trim().toLowerCase())
const isValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised.value))
const canSend = computed(() => isValid.value && normalised.value !== String(Session.data?.email || '').toLowerCase())

const askingCode = computed(() => !flow.active.value)

function close() {
  flow.reset()
  newEmail.value = ''
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    flow.reset()
    newEmail.value = ''
  }
})

async function send() {
  if (!canSend.value) return
  await flow.request('email', normalised.value)
}

async function confirm(code) {
  const applied = await flow.confirm(code)

  if (applied) {
    AlertSuccess(tdc('Email updated.'))
    emit('changed')
    close()
  }
}
</script>

<template>
  <q-dialog :model-value="modelValue && askingCode" persistent @update:model-value="value => !value && close()">
    <s-card class="change-dialog">
      <q-card-section class="row items-center">
        <div class="text-h6 col">{{ tdc('Change email') }}</div>
        <s-btn flat round dense icon="close" :aria-label="tdc('Close')" data-test="email-close" @click="close" />
      </q-card-section>

      <q-card-section class="q-gutter-y-md">
        <div class="text-caption text-grey-7">
          {{ tdc('Current email') }}: {{ Session.data?.email || '—' }}
        </div>

        <s-input
          v-model="newEmail"
          type="email"
          autocomplete="email"
          :label="tdc('New email')"
          dense
          outlined
          autofocus
          data-test="new-email"
          @keyup.enter="send"
        />

        <div v-if="newEmail && !isValid" class="text-caption text-negative" role="alert">
          {{ tdc('Invalid email') }}
        </div>

        <div class="text-caption text-grey-7">
          {{ tdc('A verification code will be sent to the new email. It only changes after you confirm the code.') }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <s-btn flat no-caps :label="tdc('Cancel')" @click="close" />
        <s-btn
          unelevated
          no-caps
          color="primary"
          icon="mail"
          :label="tdc('Send verification code')"
          :loading="flow.status.value === 'sending'"
          :disable="!canSend"
          data-test="send-email-code"
          @click="send"
        />
      </q-card-actions>
    </s-card>
  </q-dialog>

  <ContactOtpDialog
    :model-value="modelValue && flow.active.value"
    channel="email"
    :identifier="flow.identifier.value"
    v-model:otp="flow.otp.value"
    :status="flow.status.value"
    @confirm="confirm"
    @resend="flow.request('email', flow.identifier.value, { resend: true })"
    @cancel="close"
  />
</template>

<style scoped>
.change-dialog { width: 440px; max-width: 94vw; max-height: 94vh; overflow-y: auto; }
</style>
