<template>
  <q-dialog v-model="dialog" maximized>
    <s-modal-card :title="tdc('Preview PDF')" icon="picture_as_pdf" fullscreen flush @close="dialog = false" :class="$q.dark.isActive ? 'bg-grey-10 text-white' : 'bg-grey-3 text-dark'">
      <template #bar-actions>
        <!-- ZOOM -->
        <s-btn flat dense icon="zoom_out" @click="zoomOut" />
        <span class="q-mx-sm">{{ Math.round(scale * 100) }}%</span>
        <s-btn flat dense icon="zoom_in" @click="zoomIn" />

        <q-separator vertical class="q-mx-sm" />

        <!-- PAGINA -->
        <s-btn flat dense icon="chevron_left" @click="prevPage" />
        <span class="q-mx-sm">{{ page }} / {{ totalPages }}</span>
        <s-btn flat dense icon="chevron_right" @click="nextPage" />

        <q-separator vertical class="q-mx-sm" />

        <!-- DOWNLOAD -->
        <s-btn flat dense icon="download" @click="downloadPdf" />
      </template>

      <!-- VIEW -->
      <div class="col scroll" style="min-height: 0;">
        <div class="flex flex-center">
          <canvas ref="canvasRef"></canvas>
        </div>
      </div>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { tdc } from '../services/translation'

// worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// props
const props = defineProps({
  modelValue: Boolean,
  src: String
})

// emit
const emit = defineEmits(['update:modelValue'])

// ✅ v-model proxy (CORRETO)
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// refs
const canvasRef = ref(null)
const pdfDoc = ref(null)
const page = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)

// carregar PDF
async function loadPdf() {
  if (!props.src) return

  const loadingTask = pdfjsLib.getDocument(props.src)
  pdfDoc.value = await loadingTask.promise

  totalPages.value = pdfDoc.value.numPages
  page.value = 1

  await renderPage()
}

// render page
async function renderPage() {
  const pdf = pdfDoc.value
  if (!pdf) return

  const p = await pdf.getPage(page.value)

  const viewport = p.getViewport({ scale: scale.value })
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  canvas.height = viewport.height
  canvas.width = viewport.width

  await p.render({
    canvasContext: ctx,
    viewport
  }).promise
}

// controls
function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    renderPage()
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    renderPage()
  }
}

function zoomIn() {
  scale.value += 0.2
  renderPage()
}

function zoomOut() {
  if (scale.value > 0.4) {
    scale.value -= 0.2
    renderPage()
  }
}

// download
function downloadPdf() {
  if (props.src) {
    window.open(props.src, '_blank')
  }
}


// watch modal open
watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    loadPdf()
  }
})
</script>

<style scoped>
canvas {
  max-width: 100%;
}
</style>