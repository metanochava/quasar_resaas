<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'
import { AlertSuccess } from '../../../boot/alerts'
import { passwordStrength } from '../../../utils/passwordStrength'

// Change the account's own password (the existing endpoint,
// UserStore.change_password_email). The fields live only in this dialog's
// local state - never Pinia/storage - and are wiped whenever it closes. The
// strength bar is a visual aid; the backend alone decides what is accepted.
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'changed'])

const Session = useUserStore()

const current = ref('')
const next = ref('')
const confirm = ref('')
const saving = ref(false)

const strength = computed(() => passwordStrength(next.value))
const mismatch = computed(() => !!confirm.value && next.value !== confirm.value)

const canSubmit = computed(() => !!(
  Session.data?.email &&
  current.value &&
  next.value.length >= 8 &&
  next.value === confirm.value
))

const barColor = computed(() => ['negative', 'negative', 'warning', 'positive', 'positive'][strength.value.score])

function wipe() {
  current.value = ''
  next.value = ''
  confirm.value = ''
}

function close() {
  wipe()
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (open) => { if (!open) wipe() })
onBeforeUnmount(wipe)

async function submit() {
  if (!canSubmit.value || saving.value) return

  saving.value = true

  try {
    await Session.change_password_email(Session.data.email, current.value, next.value)
    AlertSuccess(tdc('Password updated.'))
    emit('changed')
    close()
  } catch {
    // the API client alerts the backend's message (wrong current password, ...)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="value => !value && close()">
    <s-modal-card
      :title="tdc('Change password')"
      icon="key"
      form
      :close-disable="saving"
      @close="close"
      @submit="submit"
    >
      <div class="q-gutter-y-md">
        <s-input
          v-model="current"
          type="password"
          autocomplete="current-password"
          :label="tdc('Current password')"
          dense
          outlined
          autofocus
          data-test="current-password"
        />

        <div>
          <s-input
            v-model="next"
            type="password"
            autocomplete="new-password"
            :label="tdc('New password')"
            dense
            outlined
            data-test="next-password"
          />

          <div v-if="next" class="q-mt-sm" data-test="strength">
            <q-linear-progress
              :value="strength.percent / 100"
              :color="barColor"
              rounded
              size="6px"
              :aria-label="tdc('Password strength')"
            />
            <div class="text-caption q-mt-xs" data-test="strength-level">
              {{ tdc('Password strength') }}: {{ tdc(strength.level) }}
            </div>
          </div>
        </div>

        <s-input
          v-model="confirm"
          type="password"
          autocomplete="new-password"
          :label="tdc('Confirm password')"
          dense
          outlined
          data-test="confirm-password"
        />

        <div v-if="mismatch" class="text-caption text-negative" role="alert" data-test="mismatch">
          {{ tdc('The passwords do not match') }}
        </div>

        <div v-if="!Session.data?.email" class="text-caption text-grey-7">
          {{ tdc('An email is required on your account to change the password') }}
        </div>
      </div>

      <template #footer>
        <s-btn flat no-caps :label="tdc('Cancel')" :disable="saving" data-test="password-cancel" @click="close" />
        <s-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          icon="lock_reset"
          :label="tdc('Update password')"
          :loading="saving"
          :disable="!canSubmit"
          data-test="password-submit"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>
