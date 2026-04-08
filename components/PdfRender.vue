<template>
  <q-dialog v-model="dialog" full-width full-height>
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
        <q-btn dense flat icon="close" @click="dialog = false" />
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
import { computed, watch } from 'vue'

// props
const props = defineProps({
  modelValue: Boolean,
  src: String, // URL ou Blob
  title: String
})

// emit
const emit = defineEmits(['update:modelValue'])

// ✅ v-model proxy (CORRETO)
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// URL do PDF
const pdfUrl = computed(() => props.src)

// download
function downloadPdf() {
  if (pdfUrl.value) {
    window.open(pdfUrl.value, '_blank')
  }
}

// limpar memória (blob)
watch(() => props.modelValue, (val) => {
  if (!val && props.src?.startsWith('blob:')) {
    URL.revokeObjectURL(props.src)
  }
})
</script>

<style scoped>
/* opcional: scroll suave */
iframe {
  background: #1e1e1e;
}
</style>