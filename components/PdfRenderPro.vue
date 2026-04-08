<template>
  <q-dialog v-model="dialog" maximized>
    <q-card class="bg-grey-10 text-white">

      <!-- TOOLBAR -->
      <q-bar class="bg-dark">

        <!-- ZOOM -->
        <q-btn flat icon="zoom_out" @click="zoomOut" />
        <span class="q-mx-sm">{{ Math.round(scale * 100) }}%</span>
        <q-btn flat icon="zoom_in" @click="zoomIn" />

        <q-separator vertical class="q-mx-sm" />

        <!-- PAGINA -->
        <q-btn flat icon="chevron_left" @click="prevPage" />
        <span class="q-mx-sm">{{ page }} / {{ totalPages }}</span>
        <q-btn flat icon="chevron_right" @click="nextPage" />

        <q-space />

        <!-- DOWNLOAD -->
        <q-btn flat icon="download" @click="downloadPdf" />

        <!-- CLOSE -->
        <q-btn flat icon="close" @click="dialog = false" />
      </q-bar>

      <!-- VIEW -->
      <q-card-section class="q-pa-none scroll" style="height: 100vh;">
        <div class="flex flex-center">
          <canvas ref="canvasRef"></canvas>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

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

// watch abrir modal
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