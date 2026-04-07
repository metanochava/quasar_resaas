<template>
  <q-dialog v-model="modelValue" maximized>
    <s-card class="bg-black">

      <!-- HEADER -->
      <q-bar class="bg-primary text-white">
        <div class="text-subtitle1">
          {{ title || 'Preview PDF' }}
        </div>

        <q-space />

        <!-- DOWNLOAD -->
        <q-btn
          v-if="pdfUrl"
          dense
          flat
          icon="download"
          @click="downloadPdf"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>

        <!-- CLOSE -->
        <q-btn dense flat icon="close" v-close-popup />
      </q-bar>

      <!-- BODY -->
      <q-card-section class="q-pa-none" style="height: 100vh;">
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          style="width: 100%; height: 100%; border: none;"
        />
      </q-card-section>

    </s-card>
  </q-dialog>
</template>

<script setup>
import { watch } from 'vue'

// props
const props = defineProps({
  modelValue: Boolean,
  src: String, // URL ou Blob URL
  title: String
})

// emit
const emit = defineEmits(['update:modelValue'])

// computed url
const pdfUrl = props.src

// fechar
function close() {
  emit('update:modelValue', false)
}

// download
function downloadPdf() {
  window.open(pdfUrl, '_blank')
}

// limpar memória (blob)
watch(() => props.modelValue, (val) => {
  if (!val && props.src?.startsWith('blob:')) {
    URL.revokeObjectURL(props.src)
  }
})
</script>