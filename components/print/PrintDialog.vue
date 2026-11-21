<template>
  <!-- the print dialog of a printable document (django_resaas core/printing):
       a preview of the PDF on the chosen printer / paper, then Print. The
       browser's own print window only comes up for the last step (a web page
       cannot send to a printer by itself). -->
  <q-dialog v-model="open" persistent>
    <s-modal-card
      :title="document_ ? `${tdc('Print')} ${tdc(document_.label)}` : tdc('Print')"
      icon="print"
      width="900px"
      data-test="print-dialog"
      @close="open = false"
    >
      <div v-if="unavailable" class="q-pa-lg text-center text-grey-7" data-test="print-dialog-unavailable">
        <q-icon name="block" size="36px" />
        <div class="q-mt-sm">{{ tdc('This document cannot be printed here.') }}</div>
      </div>

      <!-- the choices on top, the preview below at full width -->
      <div v-else class="column q-gutter-y-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-5">
            <s-select
              v-model="printerId"
              :options="printerOptions"
              emit-value map-options clearable dense
              :label="tdc('Printer')"
              data-test="print-printer"
              @update:model-value="onPrinter"
            />
          </div>
          <div class="col-12 col-sm-4">
            <s-select
              v-model="paper"
              :options="paperOptions"
              emit-value map-options dense
              :label="tdc('Paper')"
              data-test="print-paper"
            />
          </div>
          <div class="col-12 col-sm-3">
            <s-checkbox v-model="remember" :label="tdc('Remember on this device')" data-test="print-remember" />
          </div>
        </div>

        <div class="print-preview" data-test="print-preview">
          <div v-if="loading" class="absolute-center"><q-spinner color="primary" size="40px" /></div>
          <div v-else-if="failed" class="absolute-center text-negative text-center" data-test="print-preview-error">
            <q-icon name="error_outline" size="32px" />
            <div>{{ tdc('Could not prepare the document.') }}</div>
          </div>
          <iframe v-if="previewUrl" ref="frame" :src="previewUrl" class="print-preview__frame" :title="tdc('Preview')" />
        </div>
      </div>

      <template #footer>
        <s-btn flat :label="tdc('Close')" data-test="print-close" @click="open = false">
          <s-tooltip>{{ tdc('Close without printing') }}</s-tooltip>
        </s-btn>
        <s-btn flat icon="download" :label="tdc('Download')" :disable="!previewUrl" data-test="print-download" @click="download">
          <s-tooltip>{{ tdc('Save the PDF') }}</s-tooltip>
        </s-btn>
        <s-btn unelevated color="primary" icon="print" :label="tdc('Print')" :disable="!previewUrl" data-test="print-confirm" @click="print">
          <s-tooltip>{{ tdc('Print with this printer and paper') }}</s-tooltip>
        </s-btn>
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { tdc } from '../../services/translation'
import { deviceChoice, documentPdf, loadPrinting, paperFor, rememberChoice } from '../../services/printing'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // the document's code, e.g. "sales.receipt"
  document: { type: String, required: true },
  objectId: { type: [String, Number], default: null }
})
const emit = defineEmits(['update:modelValue', 'printed'])

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const document_ = ref(null)
const printers = ref([])
const formats = ref([])
const unavailable = ref(false)
const printerId = ref(null)
const paper = ref(null)
const remember = ref(false)
const loading = ref(false)
const failed = ref(false)
const previewUrl = ref(null)
const frame = ref(null)
let blob = null

function paperLabel (code) {
  const format = formats.value.find(row => row.code === code)
  return format ? tdc(format.label) : code
}
const paperOptions = computed(() => (document_.value?.formats || []).map(code => ({ value: code, label: paperLabel(code) })))
const printerOptions = computed(() =>
  printers.value
    .filter(p => document_.value?.formats.includes(p.paper_format))
    .map(p => ({ value: p.id, label: `${p.name} · ${paperLabel(p.paper_format)}` }))
)

function onPrinter (id) {
  const printer = printers.value.find(p => p.id === id)
  if (printer && document_.value?.formats.includes(printer.paper_format)) paper.value = printer.paper_format
}

function clearPreview () {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  blob = null
}

async function preview () {
  if (!document_.value || !props.objectId || !paper.value) return
  loading.value = true
  failed.value = false
  clearPreview()
  try {
    const result = await documentPdf(props.document, props.objectId, { paper: paper.value })
    blob = result.blob
    previewUrl.value = URL.createObjectURL(blob)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function start () {
  unavailable.value = false
  try {
    const data = await loadPrinting()
    document_.value = data.documents.find(row => row.code === props.document) || null
    printers.value = data.printers
    formats.value = data.formats
  } catch {
    document_.value = null
  }
  if (!document_.value) {
    unavailable.value = true
    return
  }
  const device = deviceChoice(props.document)
  printerId.value = device?.printer || document_.value.printer?.id || null
  paper.value = paperFor(document_.value)
  remember.value = Boolean(device)
  await preview()
}

function keepChoice () {
  rememberChoice(props.document, remember.value ? { printer: printerId.value, paper: paper.value } : null)
}

function print () {
  keepChoice()
  const target = frame.value?.contentWindow
  try {
    target.focus()
    target.print()
  } catch {
    window.open(previewUrl.value, '_blank')
  }
  emit('printed', { document: props.document, paper: paper.value })
}

function download () {
  if (!previewUrl.value) return
  keepChoice()
  const link = document.createElement('a')
  link.href = previewUrl.value
  link.download = `${props.document}-${props.objectId}.pdf`
  link.click()
}

watch(() => props.modelValue, isOpen => { if (isOpen) start(); else clearPreview() }, { immediate: true })
watch(paper, (now, before) => { if (props.modelValue && before && now !== before) preview() })
onBeforeUnmount(clearPreview)

defineExpose({ print, preview })
</script>

<style scoped>
.print-preview {
  position: relative;
  height: 60vh;
  min-height: 320px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #f4f4f4;
  overflow: hidden;
}
.print-preview__frame {
  width: 100%;
  height: 100%;
  border: 0;
}
.body--dark .print-preview { background: #1d1d1d; border-color: rgba(255, 255, 255, 0.12); }
</style>
