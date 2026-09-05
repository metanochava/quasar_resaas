<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="Resignation.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="Resignation"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useResignationStore } from '../../../stores/ResignationStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

const route = useRoute()
const Resignation = useResignationStore()
const ready = ref(false)

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

async function load(id) {
  if (!id) {
    Resignation.resetForm?.()
    return
  }

  if (String(Resignation.row?.id) === String(id)) {
    Resignation.form = Resignation.row
    return
  }

  Resignation.row = await Resignation.getById(id)
}

async function init() {
  try {
    ready.value = false
    await Resignation.init()

    const id = route.params.id
    await load(id)

    ready.value = true
  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

watch(
  () => route.params,
  async (params) => {
    if (!params) return
    await load(params.id)
  },
  { immediate: false }
)

function onSaved(res) {
}

onMounted(init)
</script>
