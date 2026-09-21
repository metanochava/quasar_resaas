<template>

  <q-dialog v-model="dialog">

    <s-modal-card :title="tdc('New person')" icon="person_add" width="760px" footer-raw>
      <Form
        :store="Person"
        @saved="onSaved"
      />

      <AddressLocationPicker
        :model-value="Person.form.address"
        @update:model-value="Person.form = { ...Person.form, address: $event }"
      />

      <template #footer>
        <ActionForm
          :store="Person"
          :buttons="['cancel', 'reset', 'edit','delete', 'save']"
        />
      </template>
    </s-modal-card>

  </q-dialog>

</template>

<script setup>

import { computed, watch } from 'vue'
import { tdc } from '../../services/translation'

import  Form  from '../../components/engine/FormComponent.vue'
import  ActionForm  from '../../components/auto/ActionForm.vue'
import AddressLocationPicker from '../../components/address/AddressLocationPicker.vue'
import { usePersonStore }  from '../../stores/PersonStore'

const props = defineProps({

  modelValue: Boolean,

})

const emit = defineEmits([
  'update:modelValue',
  'saved'
])

const Person = usePersonStore()

// ======================================
// DIALOG
// ======================================

const dialog = computed({

  get: () => props.modelValue,

  set: (v) => emit('update:modelValue', v)

})

// ======================================
// INIT
// ======================================

watch(
  () => props.modelValue,
  (opened) => {

    if (!opened) return

    Person.resetForm()

    Person.form = {
      ...Person.form,
    }
  }
)

// ======================================
// SAVED
// ======================================

function onSaved(res) {

  dialog.value = false

  emit('saved', res)
}

</script>