<script setup>
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { tdc } from '../../services/translation'
import ModalCard from './ModalCard.vue'

// The modal behind `sDialog()` (services/dialog.js): a confirmation / choice
// dialog in the ONE RESAAS modal pattern (q-bar header, static footer) instead of
// Quasar's bare Dialog-plugin card. It accepts the options the plugin call sites
// already pass - title, message, persistent, ok, cancel and options { type:
// 'radio' | 'checkbox', model, items, filter? } or prompt { model, type, label, isValid }
// (a text answer, e.g. a reason) - and resolves like the plugin does:
// onOk(value) receives the chosen model / typed text, onCancel / onDismiss as usual.
const props = defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  html: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
  ok: { type: [Boolean, Object, String], default: true },
  cancel: { type: [Boolean, Object, String], default: false },
  options: { type: Object, default: null },
  prompt: { type: Object, default: null },
  icon: { type: String, default: '' }
})

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const answer = props.prompt || props.options
const model = ref(answer ? answer.model ?? null : null)

const isChoice = computed(() => !!props.options?.items?.length)
const choiceType = computed(() => props.options?.type || 'radio')
const valid = computed(() => (answer?.isValid ? answer.isValid(model.value) : true))

// A filter on top of the choice list. `options.filter: true` always shows it
// (the login flow - Entity -> Branch -> Group - asks for it on every step),
// `false` never does; left out, it appears once the list is long enough to be
// worth searching. It stays static above the list, which scrolls on its own.
const FILTER_FROM = 7
const filter = ref('')
const showFilter = computed(() => {
  if (!isChoice.value) return false
  const wanted = props.options.filter
  if (typeof wanted === 'boolean') return wanted
  return props.options.items.length >= FILTER_FROM
})
const filteredItems = computed(() => {
  const items = props.options?.items || []
  const q = filter.value.trim().toLowerCase()
  if (!q) return items
  return items.filter(it => String(it.label ?? '').toLowerCase().includes(q))
})

function pick(value) {
  if (choiceType.value === 'checkbox') {
    const list = Array.isArray(model.value) ? model.value.slice() : []
    const at = list.indexOf(value)
    if (at === -1) list.push(value)
    else list.splice(at, 1)
    model.value = list
  } else {
    model.value = value
  }
}

function isChecked(value) {
  return choiceType.value === 'checkbox'
    ? Array.isArray(model.value) && model.value.includes(value)
    : model.value === value
}

// A double click on a row means "this one, done": select it and confirm, the
// same OK the footer button gives. For a single-select (radio) list the two
// clicks just set the same value, then confirm.
function pickAndConfirm(value) {
  if (choiceType.value !== 'checkbox') model.value = value
  confirm()
}

function button(spec, fallbackLabel, fallbackColor) {
  const custom = spec && typeof spec === 'object' ? spec : {}
  const label = typeof spec === 'string' ? spec : (custom.label || fallbackLabel)

  return { flat: true, color: fallbackColor, ...custom, label }
}

const okButton = computed(() => (props.ok === false ? null : button(props.ok === true ? null : props.ok, tdc('OK'), 'primary')))
const cancelButton = computed(() => (props.cancel ? button(props.cancel === true ? null : props.cancel, tdc('Cancel'), 'grey-8') : null))

function confirm() {
  if (!valid.value) return
  onDialogOK(answer ? model.value : undefined)
}
</script>

<template>
  <q-dialog ref="dialogRef" :persistent="persistent" @hide="onDialogHide">
    <ModalCard :title="title" :icon="icon" width="440px" @close="onDialogCancel">
      <div v-if="message && html" v-html="message" />
      <div v-else-if="message" data-test="dialog-message">{{ message }}</div>

      <div
        v-if="isChoice"
        :class="{ 'q-mt-md': !!message }"
        data-test="dialog-choice"
      >
        <s-input
          v-if="showFilter"
          v-model="filter"
          dense
          clearable
          autofocus
          :placeholder="tdc('Filter')"
          class="choice-filter"
          data-test="dialog-filter"
        >
          <template #prepend><q-icon name="search" /></template>
        </s-input>

        <q-list class="choice-list" :class="{ 'choice-scroll': showFilter }">
          <q-item
            v-for="(item, i) in filteredItems"
            :key="item.value?.id ?? (typeof item.value === 'object' ? i : item.value)"
            clickable
            v-ripple
            @click="pick(item.value)"
            @dblclick="pickAndConfirm(item.value)"
          >
            <q-item-section side>
              <q-radio
                v-if="choiceType !== 'checkbox'"
                :model-value="model"
                :val="item.value"
                @update:model-value="model = item.value"
              />
              <q-checkbox
                v-else
                :model-value="isChecked(item.value)"
                @update:model-value="pick(item.value)"
              />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>

          <q-item v-if="!filteredItems.length">
            <q-item-section class="text-grey">{{ tdc('No results') }}</q-item-section>
          </q-item>
        </q-list>
      </div>

      <s-input
        v-if="prompt"
        v-model="model"
        :type="prompt.type || 'text'"
        :label="prompt.label"
        autofocus
        :autogrow="prompt.type === 'textarea'"
        :class="{ 'q-mt-md': !!message }"
        data-test="dialog-prompt"
      />

      <template #footer>
        <s-btn v-if="cancelButton" v-bind="cancelButton" no-caps data-test="dialog-cancel" @click="onDialogCancel" />
        <s-btn v-if="okButton" v-bind="okButton" no-caps :disable="!valid" data-test="dialog-ok" @click="confirm" />
      </template>
    </ModalCard>
  </q-dialog>
</template>

<style scoped>
/* the filter stays put at the top; only the list below it scrolls. It needs a
   solid background so rows do not show through it while they scroll. */
.choice-filter {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

:global(body.body--dark) .choice-filter {
  background: #1d1d1d;
}

.choice-scroll {
  max-height: 40vh;
  overflow-y: auto;
}
</style>
