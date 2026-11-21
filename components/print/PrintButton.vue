<template>
  <!-- a printable document (django_resaas core/printing): opens the print
       dialog (s-print-dialog: printer, paper, preview, Print). Nothing shows
       when the current profile cannot print it here. -->
  <div v-if="document_" class="row no-wrap items-center s-print-btn" data-test="print-btn">
    <s-btn
      v-bind="$attrs"
      :icon="icon"
      :label="label"
      :color="color"
      no-caps
      data-test="print-main"
      @click="openDialog"
    >
      <s-tooltip>{{ tdc('Print') }} {{ tdc(document_.label) }}</s-tooltip>
    </s-btn>

    <PrintDialog
      v-model="dialogOpen"
      :document="document"
      :object-id="objectId"
      @printed="event => emit('printed', event)"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

import { tdc } from '../../services/translation'
import { loadPrinting } from '../../services/printing'
import PrintDialog from './PrintDialog.vue'

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
const dialogOpen = ref(false)

async function load () {
  try {
    const data = await loadPrinting()
    document_.value = data.documents.find(row => row.code === props.document) || null
  } catch {
    document_.value = null
  }
}

function openDialog () {
  if (props.objectId) dialogOpen.value = true
}

onMounted(load)
watch(() => props.document, load)

defineExpose({ open: openDialog })
</script>
