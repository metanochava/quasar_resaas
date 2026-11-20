<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="Printer.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>
    <FormTwo
      v-else
      :store="Printer"
      :ignore-fields="ignoreFields"
      centerCol="col-12 col-md-7"
      rightCol="col-12 col-md-5"
      @saved="onSaved"
    >
      <!-- the documents this printer prints by default here (one printer per
           document and Branch: the backend moves it from the previous one) -->
      <template #right>
        <s-select
          v-model="Printer.form.documents"
          :options="documentOptions"
          multiple use-chips emit-value map-options clearable
          :label="tdc('Default for')"
          :hint="tdc('The documents this printer prints by default in this branch')"
          data-test="printer-documents"
        />
      </template>
    </FormTwo>

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePrinterStore } from '../../stores/PrinterStore.js'
import FormTwo from '../../components/auto/FormTwo.vue'
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { loadPrinting, forgetPrinting } from '../../services/printing'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const Printer = usePrinterStore()

// ---------------- STATE ----------------
const ready = ref(false)

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at',
  'entity',
  'branch',
  'documents'
]

// every document this profile may print, with the papers it supports
const documents = ref([])
const documentOptions = computed(() => documents.value.map(row => ({
  value: row.code,
  label: `${tdc(row.label)} (${row.code})`
})))

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    Printer.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(Printer.row?.id) === String(id)) {
    Printer.form = Printer.row
    return
  }

  Printer.row = await Printer.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Printer.init()
    try { documents.value = (await loadPrinting()).documents } catch { documents.value = [] }

    const id = route.params.id
    await load(id)
    if (!Array.isArray(Printer.form.documents)) Printer.form.documents = []

    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- WATCH ROUTE (FIXED) ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    // always reloads when the route changes
    await load(id)
  },
  { immediate: false } // init already handles the first load
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // the Branch's defaults changed: ask again on the next print
  forgetPrinting()
  // console.log('Saved successfully', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
