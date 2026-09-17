<script setup>
import { ref, computed, watch } from 'vue'
import Form from './FormComponent.vue'
import ActionForm from '../auto/ActionForm.vue'
import { tdc } from '../../services/translation'
import { getRelationStore } from '../../base/relation_store_registry'

// Django-Admin-style "add related" dialog - a generic, metadata-driven
// create form for WHATEVER model relationConfig points to (never
// hardcoded to one model, unlike components/person/PersonSearch.vue's
// own create dialog, which is Person-specific). Reused identically by
// s-select and s-multiselect (SelectComponent.vue), since both need
// the exact same "create the related record without leaving this
// form" behavior.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  relationConfig: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'created'])

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

watch(() => props.modelValue, async (open) => {
  if (!open) return

  ready.value = false

  // loadSchemaOnce() only - NOT store.init() (which also calls
  // loadData(), fetching the related model's full list). This dialog
  // only ever creates a record, so it needs the schema/fields, never
  // the list - and a user with `add` but not `list`/`view` on the
  // related model would otherwise have this dialog break on a 403 it
  // has no reason to hit.
  await store.value.loadSchemaOnce()
  store.value.resetForm()

  ready.value = true
})

function close() {
  emit('update:modelValue', false)
}

function onSaved(record) {
  emit('created', record)
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
    <s-card style="min-width: 480px; max-width: 95vw" class="rounded-borders">
      <q-bar
        class="row items-center"
        :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      >
        <div class="text-h6">
          {{ tdc('New') }} {{ tdc(relationConfig.model) }}
        </div>

        <q-space />

        <s-btn flat round dense icon="close" @click="close" />
      </q-bar>

      <q-card-section v-if="!ready" class="flex flex-center q-pa-lg">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </q-card-section>

      <q-card-section v-else class="q-pa-none">
        <Form
          ref="formRef"
          :store="store"
          :ignore-fields="ignoreFields"
          @saved="onSaved"
        />

        <ActionForm
          :store="store"
          :buttons="['cancel', 'save']"
          @cancel="close"
          @save="save"
        />
      </q-card-section>
    </s-card>
  </q-dialog>
</template>
