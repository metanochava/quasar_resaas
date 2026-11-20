<template>
  <!-- a printable document (django_resaas core/printing): print it on the
       default paper, or choose the printer / paper first. Nothing shows when
       the current profile cannot print it here. -->
  <div v-if="document_" class="row no-wrap items-center s-print-btn" data-test="print-btn">
    <s-btn
      v-bind="$attrs"
      :icon="icon"
      :label="label"
      :color="color"
      :loading="busy"
      no-caps
      data-test="print-main"
      @click="print()"
    >
      <s-tooltip>{{ tdc('Print') }} {{ tdc(document_.label) }} ({{ paperLabel(currentPaper) }})</s-tooltip>
    </s-btn>
    <s-btn
      flat round dense size="sm" icon="tune" :color="color" class="q-ml-xs"
      data-test="print-options"
      @click="openOptions"
    >
      <s-tooltip>{{ tdc('Choose the printer and the paper') }}</s-tooltip>
    </s-btn>

    <q-dialog v-model="optionsOpen">
      <s-modal-card :title="`${tdc('Print')} ${tdc(document_.label)}`" icon="print" width="420px">
        <div class="q-gutter-md">
          <s-select
            v-model="printerId"
            :options="printerOptions"
            emit-value map-options clearable
            :label="tdc('Printer')"
            data-test="print-printer"
            @update:model-value="onPrinter"
          />
          <s-select
            v-model="paper"
            :options="paperOptions"
            emit-value map-options
            :label="tdc('Paper')"
            data-test="print-paper"
          />
          <s-checkbox v-model="remember" :label="tdc('Remember on this device')" data-test="print-remember" />
        </div>

        <template #footer>
          <s-btn flat :label="tdc('Cancel')" @click="optionsOpen = false">
            <s-tooltip>{{ tdc('Close without printing') }}</s-tooltip>
          </s-btn>
          <s-btn unelevated color="primary" icon="print" :label="tdc('Print')" :loading="busy" data-test="print-confirm" @click="confirm">
            <s-tooltip>{{ tdc('Print with this printer and paper') }}</s-tooltip>
          </s-btn>
        </template>
      </s-modal-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import { tdc } from '../../services/translation'
import { Alert } from '../../boot/alerts'
import { deviceChoice, loadPrinting, paperFor, printDocument, rememberChoice } from '../../services/printing'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // the document's code, e.g. "sales.receipt"
  document: { type: String, required: true },
  objectId: { type: [String, Number], default: null },
  label: { type: String, default: '' },
  icon: { type: String, default: 'print' },
  color: { type: String, default: 'primary' }
})
const emit = defineEmits(['printed'])

const document_ = ref(null)
const printers = ref([])
const formats = ref([])
const busy = ref(false)
const optionsOpen = ref(false)
const printerId = ref(null)
const paper = ref(null)
const remember = ref(false)

const currentPaper = computed(() => (document_.value ? paperFor(document_.value) : null))

function paperLabel (code) {
  const format = formats.value.find(row => row.code === code)
  return format ? tdc(format.label) : code
}

const paperOptions = computed(() =>
  (document_.value?.formats || []).map(code => ({ value: code, label: paperLabel(code) }))
)
const printerOptions = computed(() =>
  printers.value
    .filter(p => document_.value?.formats.includes(p.paper_format))
    .map(p => ({ value: p.id, label: `${p.name} · ${paperLabel(p.paper_format)}` }))
)

async function load () {
  try {
    const data = await loadPrinting()
    document_.value = data.documents.find(row => row.code === props.document) || null
    printers.value = data.printers
    formats.value = data.formats
  } catch {
    document_.value = null
  }
}

function onPrinter (id) {
  const printer = printers.value.find(p => p.id === id)
  if (printer && document_.value?.formats.includes(printer.paper_format)) paper.value = printer.paper_format
}

function openOptions () {
  const device = deviceChoice(props.document)
  printerId.value = device?.printer || document_.value?.printer?.id || null
  paper.value = currentPaper.value
  remember.value = Boolean(device)
  optionsOpen.value = true
}

async function print (chosenPaper = null) {
  if (!props.objectId || busy.value) return
  busy.value = true
  try {
    const used = await printDocument(props.document, props.objectId, { paper: chosenPaper })
    emit('printed', { document: props.document, paper: used })
  } catch (error) {
    Alert(error?.response)
  } finally {
    busy.value = false
  }
}

async function confirm () {
  rememberChoice(props.document, remember.value ? { printer: printerId.value, paper: paper.value } : null)
  await print(paper.value)
  optionsOpen.value = false
}

onMounted(load)
watch(() => props.document, load)

defineExpose({ print })
</script>
