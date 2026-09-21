<script setup>
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { tdc } from '../../services/translation'
import ModalCard from './ModalCard.vue'

// The modal behind `sDialog()` (services/dialog.js): a confirmation / choice
// dialog in the ONE RESAAS modal pattern (q-bar header, static footer) instead of
// Quasar's bare Dialog-plugin card. It accepts the options the plugin call sites
// already pass - title, message, persistent, ok, cancel and options { type:
// 'radio' | 'checkbox', model, items } - and resolves like the plugin does:
// onOk(value) receives the chosen model, onCancel / onDismiss as usual.
const props = defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  html: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
  ok: { type: [Boolean, Object, String], default: true },
  cancel: { type: [Boolean, Object, String], default: false },
  options: { type: Object, default: null },
  icon: { type: String, default: '' }
})

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const model = ref(props.options ? props.options.model : null)

const isChoice = computed(() => !!props.options?.items?.length)
const valid = computed(() => (props.options?.isValid ? props.options.isValid(model.value) : true))

function button(spec, fallbackLabel, fallbackColor) {
  const custom = spec && typeof spec === 'object' ? spec : {}
  const label = typeof spec === 'string' ? spec : (custom.label || fallbackLabel)

  return { flat: true, color: fallbackColor, ...custom, label }
}

const okButton = computed(() => (props.ok === false ? null : button(props.ok === true ? null : props.ok, tdc('OK'), 'primary')))
const cancelButton = computed(() => (props.cancel ? button(props.cancel === true ? null : props.cancel, tdc('Cancel'), 'grey-8') : null))

function confirm() {
  if (!valid.value) return
  onDialogOK(props.options ? model.value : undefined)
}
</script>

<template>
  <q-dialog ref="dialogRef" :persistent="persistent" @hide="onDialogHide">
    <ModalCard :title="title" :icon="icon" width="440px" @close="onDialogCancel">
      <div v-if="message && html" v-html="message" />
      <div v-else-if="message" data-test="dialog-message">{{ message }}</div>

      <q-option-group
        v-if="isChoice"
        v-model="model"
        :type="options.type || 'radio'"
        :options="options.items"
        :class="{ 'q-mt-md': !!message }"
        data-test="dialog-choice"
      />

      <template #footer>
        <s-btn v-if="cancelButton" v-bind="cancelButton" no-caps data-test="dialog-cancel" @click="onDialogCancel" />
        <s-btn v-if="okButton" v-bind="okButton" no-caps :disable="!valid" data-test="dialog-ok" @click="confirm" />
      </template>
    </ModalCard>
  </q-dialog>
</template>
