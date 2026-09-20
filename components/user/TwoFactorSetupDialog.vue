<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

import { tdc } from '../../services/translation'
import RecoveryCodes from './RecoveryCodes.vue'

// Enrol an authenticator app. Transport-agnostic: the account page hands it the
// authenticated endpoints, the sign-in step hands it the challenge-authorised
// ones.
//   begin()        -> { secret, otpauth_uri, qr }
//   confirm(code)  -> the recovery codes (an array)
// Everything secret (key, QR, codes) lives only in this dialog's local state and
// is wiped whenever it closes. `finished` fires once the user has seen the codes.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  begin: { type: Function, required: true },
  confirm: { type: Function, required: true },
  persistent: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'finished'])

const setup = ref(null)
const code = ref('')
const codes = ref([])
const saved = ref(false)
const starting = ref(false)
const confirming = ref(false)
const failed = ref(false)

const step = computed(() => (codes.value.length ? 'codes' : 'scan'))
const validCode = computed(() => /^\d{6}$/.test(code.value.replace(/\s/g, '')))

function wipe() {
  setup.value = null
  code.value = ''
  codes.value = []
  saved.value = false
  failed.value = false
}

async function start() {
  starting.value = true
  failed.value = false

  try {
    setup.value = await props.begin()
  } catch {
    // the API client alerts the backend's message
    failed.value = true
  } finally {
    starting.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) start()
  else wipe()
}, { immediate: true })

onBeforeUnmount(wipe)

function close() {
  // recovery codes are shown once: closing before "I saved them" would lose them
  if (step.value === 'codes' && !saved.value) return
  emit('update:modelValue', false)
}

async function submit() {
  if (!validCode.value || confirming.value) return

  confirming.value = true

  try {
    codes.value = await props.confirm(code.value.replace(/\s/g, ''))
  } catch {
    code.value = ''
  } finally {
    confirming.value = false
  }
}

function done() {
  emit('finished')
  emit('update:modelValue', false)
}
</script>

<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="value => !value && close()">
    <s-card class="two-factor-dialog">
      <q-card-section class="row items-center">
        <div class="text-h6 col">{{ tdc('Set up two-factor authentication') }}</div>
        <s-btn
          v-if="!persistent && step === 'scan'"
          flat round dense icon="close" :aria-label="tdc('Close')" data-test="setup-close" @click="close"
        />
      </q-card-section>

      <template v-if="step === 'scan'">
        <q-card-section v-if="starting" class="text-center"><q-spinner size="32px" /></q-card-section>

        <q-card-section v-else-if="failed" class="text-center">
          <div class="text-negative q-mb-sm">{{ tdc('Could not start the setup.') }}</div>
          <s-btn outline no-caps :label="tdc('Try again')" data-test="setup-retry" @click="start" />
        </q-card-section>

        <q-form v-else-if="setup" @submit.prevent="submit">
          <q-card-section class="column q-gutter-y-md">
            <div class="text-body2">
              {{ tdc('Scan this QR code with an authenticator app, then enter the 6-digit code it shows.') }}
            </div>

            <div class="text-center">
              <img :src="setup.qr" :alt="tdc('QR code')" class="qr" data-test="setup-qr">
            </div>

            <div>
              <div class="text-caption text-grey-7">{{ tdc('Or enter this key manually') }}</div>
              <code class="manual-key" data-test="setup-secret">{{ setup.secret }}</code>
              <div class="q-mt-xs">
                <a :href="setup.otpauth_uri" class="text-caption" data-test="setup-link">{{ tdc('Open in authenticator app') }}</a>
              </div>
            </div>

            <s-input
              v-model="code"
              dense
              outlined
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="7"
              :label="tdc('Authentication code')"
              data-test="setup-code"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <s-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              :label="tdc('Verify and enable')"
              :loading="confirming"
              :disable="!validCode"
              data-test="setup-submit"
            />
          </q-card-actions>
        </q-form>
      </template>

      <template v-else>
        <q-card-section>
          <div class="text-body2 q-mb-md">{{ tdc('Two-factor authentication is now enabled.') }}</div>
          <RecoveryCodes :codes="codes" />
          <q-checkbox v-model="saved" class="q-mt-md" :label="tdc('I have saved my recovery codes')" data-test="codes-saved" />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <s-btn unelevated no-caps color="primary" :label="tdc('Done')" :disable="!saved" data-test="setup-done" @click="done" />
        </q-card-actions>
      </template>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.two-factor-dialog { width: 460px; max-width: 94vw; max-height: 94vh; overflow-y: auto; }
.qr { width: 200px; height: 200px; background: #fff; padding: 8px; border-radius: 8px; }
.manual-key { display: block; word-break: break-all; font-size: 14px; letter-spacing: .06em; user-select: all; }
</style>
