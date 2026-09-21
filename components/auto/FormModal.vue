<script setup>
import { computed, ref } from 'vue'
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'
import Form from '../engine/FormComponent.vue'
import ActionForm from '../../components/auto/ActionForm.vue'

const User = useUserStore()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  store: { type: Object, default: () => ({}) },
  schema: { type: Object, default: () => ({}) },
  ignoreFields: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:modelValue',
  'saved',
  'delete',
  'reset'
])

const formRef = ref(null)
const uploadProgress = ref(0)

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const isEdit = computed(() => Boolean(props.store?.form?.id))

const permissions = computed(() => {
  const model = (props.store?.model || '').toLowerCase()

  return {
    add: props.schema?.permissions?.add || `add_${model}`,
    change: props.schema?.permissions?.change || `change_${model}`,
    delete: props.schema?.permissions?.delete || `delete_${model}`
  }
})

const can = permission =>
  !!permission && User.can(String(permission).toLowerCase())

const canSave = computed(() =>
  can(
    isEdit.value
      ? permissions.value.change
      : permissions.value.add
  )
)

const title = computed(() => {
  const label =
    props.schema?.model?.label ||
    props.store?.model ||
    ''

  return `${tdc(isEdit.value ? 'Edit' : 'New')} ${tdc(label)}`
})

const close = () => {
  open.value = false
}

const save = () => {
  if (canSave.value) formRef.value?.save?.()
}

function onReset() {
  formRef.value?.resetForm?.()
  emit('reset')
}

function onDelete() {
  if (!isEdit.value || !can(permissions.value.delete)) return
  emit('delete', props.store?.form)
}

function onSaved() {
  emit('saved')
  close()
}
</script>

<template>
  <q-dialog v-model="open" persistent>
    <s-modal-card :title="title" icon="edit_note" width="760px" footer-raw @close="close">
      <div
        v-if="!store?.fields?.length"
        class="flex flex-center q-pa-lg"
      >
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <div v-else>
        <Form
          ref="formRef"
          :store="store"
          :ignore-fields="ignoreFields"
          @saved="onSaved"
        />

        <q-linear-progress
          v-if="uploadProgress > 0"
          :value="uploadProgress / 100"
          color="primary"
          class="q-mt-md"
        />
      </div>

      <template #footer>
        <ActionForm
          :store="store"
          :schema="schema"
          :buttons="['cancel', 'reset', 'edit', 'delete', 'save']"
          @cancel="close"
          @reset="onReset"
          @edit="save"
          @delete="onDelete"
          @save="save"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>
