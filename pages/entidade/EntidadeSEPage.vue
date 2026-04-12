
<template>

    <FormSE
      v-model="showForm"
      :schema="schema"
      :module="module"
      :model="model"
      :data="selectedRow"
      :can-do="canDo"
      :ignoreFields="ignoreFields"
      @saved="onSaved"
    />
    <!-- <FormPage :schema="schema" :module="module" :model="model" /> -->

</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'

import FormSE from './../../components/auto/FormSE.vue'

// import { HTTPAuth, HTTPAuthBlob, url } from '../../boot/api'
import { buildFormFromSchema } from '../../utils/autoForm'


// --- state ---
const module= ref("djnago_resaas")
const model= ref("Entidade")
can=""
schemaPath= ref('fields')

const schema = ref([])
const actions = ref([])
const config = ref({})

ignoreFields - ref(['created_at','updated_at', 'created_by', 'updated_by'])

const showForm = ref(true)

const selectedRow = ref(null)

function canDo(perm) {
  if (!perm) return true
  // if (typeof props.can === 'function') return !!props.can(perm)
  return true
}

async function init() {
  const data = await buildFormFromSchema({
    module: module,
    model: model,
    schemaPath: schemaPath,
  })
  schema.value = data.schema
  actions.value = data.actions
  config.value = data.config

}

async function onSaved() {
  showForm.value = true
}


onMounted(
  await init()
)
</script>
