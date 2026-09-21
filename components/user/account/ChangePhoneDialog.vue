<script setup>
import { ref, computed, watch } from 'vue'

import ContactOtpDialog from './ContactOtpDialog.vue'
import { useContactOtp } from '../../../composables/useContactOtp'
import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'
import { AlertSuccess } from '../../../boot/alerts'
import { COUNTRIES, countryLabel } from '../../../utils/countries'
import { toE164, isValidE164, splitE164 } from '../../../utils/phone'

// Country + number -> code sent to the NEW number -> confirm. The phone only
// changes once the backend accepts the code (useContactOtp). Reuses the
// existing COUNTRIES / countryLabel / toE164 / isValidE164 / splitE164.
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'changed'])

const Session = useUserStore()
const flow = useContactOtp()

const dial = ref('258')
const national = ref('')

const countryOptions = COUNTRIES.map(country => ({ label: countryLabel(country), value: country.dial }))

const fullNumber = computed(() => toE164(dial.value, national.value))
const isValid = computed(() => isValidE164(fullNumber.value))
const canSend = computed(() => isValid.value && fullNumber.value !== (Session.data?.mobile || ''))
const askingCode = computed(() => !flow.active.value)

function preset() {
  const parts = splitE164(Session.data?.mobile)
  dial.value = parts.dial
  national.value = ''
}

function close() {
  flow.reset()
  national.value = ''
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => {
  if (open) preset()
  else flow.reset()
}, { immediate: true })

async function send() {
  if (!canSend.value) return
  await flow.request('mobile', fullNumber.value)
}

async function confirm(code) {
  const applied = await flow.confirm(code)

  if (applied) {
    AlertSuccess(tdc('Phone number updated.'))
    emit('changed')
    close()
  }
}
</script>

<template>
  <q-dialog :model-value="modelValue && askingCode" persistent @update:model-value="value => !value && close()">
    <s-modal-card :title="tdc('Change phone number')" icon="phone_iphone" width="440px" @close="close">
      <div class="q-gutter-y-md">
        <s-select
          v-model="dial"
          :options="countryOptions"
          emit-value
          map-options
          :label="tdc('Country')"
          dense
          outlined
        />

        <s-input
          v-model="national"
          type="tel"
          autocomplete="tel-national"
          :label="tdc('Phone number')"
          dense
          outlined
          autofocus
          data-test="new-phone"
          @keyup.enter="send"
        />

        <div v-if="national && !isValid" class="text-caption text-negative" role="alert">
          {{ tdc('Invalid phone number') }}
        </div>

        <div class="text-caption text-grey-7" data-test="full-number">
          {{ tdc('Full number') }}: {{ fullNumber || '—' }}
        </div>
      </div>

      <template #footer>
        <s-btn flat no-caps :label="tdc('Cancel')" @click="close" />
        <s-btn
          unelevated
          no-caps
          color="primary"
          icon="phone_iphone"
          :label="tdc('Continue')"
          :loading="flow.status.value === 'sending'"
          :disable="!canSend"
          data-test="send-phone-code"
          @click="send"
        />
      </template>
    </s-modal-card>
  </q-dialog>

  <ContactOtpDialog
    :model-value="modelValue && flow.active.value"
    channel="mobile"
    :identifier="flow.identifier.value"
    v-model:otp="flow.otp.value"
    :status="flow.status.value"
    @confirm="confirm"
    @resend="flow.request('mobile', flow.identifier.value, { resend: true })"
    @cancel="close"
  />
</template>
