<template>

  <q-dialog v-model="dialog">

    <q-card style="min-width:700px">

      <!-- HEADER -->
      <q-card-section class="row items-center">

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
      <q-card-section>

        <FormTwo
          :store="Person"
          @saved="onSaved"
        />

      </q-card-section>

    </q-card>

  </q-dialog>

</template>

<script setup>

import { computed, watch } from 'vue'

import  FormTwo  from './../../components/auto/FormTwo.vue'
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