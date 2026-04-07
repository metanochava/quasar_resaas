<template>
  <q-dialog v-model="modelValue" maximized>
    <q-card class="bg-grey-10 text-white">

      <!-- TOOLBAR -->
      <q-bar class="bg-dark">

        <q-btn flat icon="zoom_out" @click="zoomOut" />
        <span>{{ Math.round(scale * 100) }}%</span>
        <q-btn flat icon="zoom_in" @click="zoomIn" />

        <q-separator vertical />

        <q-btn flat icon="chevron_left" @click="prevPage" />
        <span>{{ page }} / {{ totalPages }}</span>
        <q-btn flat icon="chevron_right" @click="nextPage" />

        <q-space />

        <q-btn flat icon="download" @click="downloadPdf" />
        <q-btn flat icon="close" v-close-popup />
      </q-bar>

      <!-- VIEW -->
      <q-card-section class="q-pa-none scroll" style="height: 100vh;">
        <canvas ref="canvasRef"></canvas>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const props = defineProps({
  modelValue: Boolean,
  src: String
})

const emit = defineEmits(['update:modelValue'])

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

  renderPage()
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

function downloadPdf() {
  window.open(props.src, '_blank')
}

// watch abrir modal
watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    loadPdf()
  }
})
</script>