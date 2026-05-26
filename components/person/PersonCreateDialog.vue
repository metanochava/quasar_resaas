<template>

  <q-dialog v-model="dialog">

    <q-card style="min-width:700px">

      <!-- HEADER -->
      <q-card-section :class="[$q.dark.isActive ? 'bg-dark ' : 'bg-transparent  ', 'row items-center' ]  ">

        <div class="text-h6">

          Nova Pessoa

        </div>

        <q-space />

        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />

      </q-card-section>

      <!-- FORM -->
      <!-- <q-card-section> -->

        <Form
          :store="Person"
          @saved="onSaved"
        />

      <!-- </q-card-section> -->

      <ActionForm
        :store="Paciente"
        :buttons="['cancel', 'reset', 'edit', 'save']"
        />

    </q-card>

  </q-dialog>

</template>

<script setup>

import { computed, watch } from 'vue'

import  Form  from '../../components/engine/FormComponent.vue'
import  ActionForm  from '../../components/auto/ActionForm.vue'
import { usePersonStore }  from '../../stores/PersonStore'

const props = defineProps({

  modelValue: Boolean,

  initialName: {
    type: String,
    default: ''
  }

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
      full_name: props.initialName
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