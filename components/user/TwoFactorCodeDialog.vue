<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

import { tdc } from '../../services/translation'

// Asks for ONE code - an authenticator code or a recovery code - and hands it
// to `submit(code)`. Used to confirm disabling / regenerating recovery codes.
// A rejected submit keeps the dialog open (the API client already alerted the
// backend message); the typed code is wiped whenever it closes.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  action: { type: String, required: true },
  color: { type: String, default: 'primary' },
  submit: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'done'])

const code = ref('')
const busy = ref(false)

const canSubmit = computed(() => code.value.trim().length >= 6)

watch(() => props.modelValue, (open) => { if (!open) code.value = '' })
onBeforeUnmount(() => { code.value = '' })

function close() {
  emit('update:modelValue', false)
}

async function send() {
  if (!canSubmit.value || busy.value) return

  busy.value = true

  try {
    const result = await props.submit(code.value.trim())
    emit('done', result)
    close()
  } catch {
    code.value = ''
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="value => !value && close()">
    <s-card class="code-dialog">
      <q-card-section class="row items-center">
        <div class="text-h6 col">{{ title }}</div>
        <s-btn flat round dense icon="close" :aria-label="tdc('Close')" :disable="busy" data-test="code-close" @click="close" />
      </q-card-section>

      <q-form @submit.prevent="send">
        <q-card-section class="column q-gutter-y-md">
          <div v-if="message" class="text-body2">{{ message }}</div>

          <s-input
            v-model="code"
            dense
            outlined
            autofocus
            autocomplete="one-time-code"
            :label="tdc('Authentication code or recovery code')"
            data-test="code-input"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <s-btn flat no-caps :label="tdc('Cancel')" :disable="busy" data-test="code-cancel" @click="close" />
          <s-btn
            type="submit"
            unelevated
            no-caps
            :color="color"
            :label="action"
            :loading="busy"
            :disable="!canSubmit"
            data-test="code-submit"
          />
        </q-card-actions>
      </q-form>
    </s-card>
  </q-dialog>
</template>

<style scoped>
.code-dialog { width: 420px; max-width: 94vw; }
</style>
