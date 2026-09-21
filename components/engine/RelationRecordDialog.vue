<script setup>
import { ref, computed, watch } from 'vue'
import Form from './FormComponent.vue'
import ActionForm from '../auto/ActionForm.vue'
import { tdc } from '../../services/translation'
import { getRelationStore } from '../../base/relation_store_registry'

// Django-Admin-style "add/edit/view related" dialog - a generic,
// metadata-driven form for WHATEVER model relationConfig points to
// (never hardcoded to one model, unlike components/person/
// PersonSearch.vue's own create dialog, which is Person-specific).
// Reused identically by s-select and s-multiselect (SelectComponent.vue)
// for all three modes - only `mode`/`recordId` differ.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  relationConfig: { type: Object, required: true },
  mode: {
    type: String,
    default: 'add',
    validator: v => ['add', 'edit', 'view'].includes(v)
  },
  // Required for 'edit'/'view' - the related record's id to load.
  recordId: { type: [String, Number], default: null }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const store = computed(() =>
  getRelationStore(props.relationConfig.app, props.relationConfig.model)
)

const formRef = ref(null)
const ready = ref(false)

// Same fields every generic admin form already hides - see
// pages/user/UserSEPage.vue's own ignoreFields for the precedent.
const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

const titleVerb = computed(() => ({
  add: 'New',
  edit: 'Edit',
  view: 'View'
}[props.mode]))

// 'view' has nothing to submit - drop save/edit entirely rather than
// merely disabling them, so there's no button that looks actionable but
// isn't. 'add' and 'edit' both keep the same ['save','edit'] pair -
// ActionForm.vue already decides which ONE of the two to actually show
// based on isEdit (store.form?.id), so this dialog never needs to
// branch that itself.
const buttons = computed(() =>
  props.mode === 'view' ? ['cancel'] : ['cancel', 'save', 'edit']
)

watch(() => props.modelValue, async (open) => {
  if (!open) return

  ready.value = false

  // loadSchemaOnce() only - NOT store.init() (which also calls
  // loadData(), fetching the related model's full list). This dialog
  // never needs that list - and a user with `add` but not `list`/`view`
  // on the related model would otherwise have it break on a 403 it has
  // no reason to hit.
  await store.value.loadSchemaOnce()

  if (props.mode === 'add') {
    store.value.resetForm()
  } else {
    // force: true - a previous open of this SAME dynamic store (another
    // field pointing at the same related model) may have cached a
    // different id under .row.
    await store.value.getById(props.recordId, { force: true })
  }

  ready.value = true
})

function close() {
  emit('update:modelValue', false)
}

function onSaved(record) {
  emit('saved', record)
  close()
}

async function save() {
  await formRef.value?.save()
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <s-modal-card
      :title="`${tdc(titleVerb)} ${tdc(relationConfig.model)}`"
      icon="edit_note"
      width="760px"
      footer-raw
      @close="close"
    >
      <div v-if="!ready" class="flex flex-center q-pa-lg">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <Form
        v-else
        ref="formRef"
        :store="store"
        :ignore-fields="ignoreFields"
        :readonly="mode === 'view'"
        @saved="onSaved"
      />

      <template #footer>
        <ActionForm
          :store="store"
          :buttons="buttons"
          @cancel="close"
          @save="save"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>
