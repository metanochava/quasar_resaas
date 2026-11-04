<template>
  <q-dialog v-model="dialog" full-width full-height>
    <s-modal-card :title="title || tdc('Preview PDF')" icon="picture_as_pdf" fullscreen flush @close="dialog = false">
      <template #bar-actions>
        <!-- DOWNLOAD -->
        <s-btn
          v-if="pdfUrl"
          dense
          flat
          round
          icon="download"
          @click="downloadPdf"
        >
          <s-tooltip>{{ tdc('Download') }}</s-tooltip>
        </s-btn>
      </template>

      <!-- BODY -->
      <div class="col" style="min-height: 0;">
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          class="pdf-frame"
        />
      </div>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch } from 'vue'
import { tdc } from '../services/translation'
import { pdfFileName, forgetPdf } from '../utils/pdfFile'

// props
const props = defineProps({
  modelValue: Boolean,
  src: String, // URL or Blob
  title: String,
  top: Boolean
})

// emit
const emit = defineEmits(['update:modelValue'])

// ✅ v-model proxy (CORRECT)
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// PDF URL
const pdfUrl = computed(() => props.src)

// download under the server's file name (Content-Disposition), never the
// blob URL's random uuid; a plain URL without a known name opens as before
function downloadPdf() {
  if (!pdfUrl.value) return

  const name = pdfFileName(pdfUrl.value)

  if (!name) {
    window.open(pdfUrl.value, '_blank')
    return
  }

  const link = document.createElement('a')
  link.href = pdfUrl.value
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// free memory (blob)
watch(() => props.modelValue, (val) => {
  if (!val && props.src?.startsWith('blob:')) {
    URL.revokeObjectURL(props.src)
    forgetPdf(props.src)
  }
})
</script>

<style scoped>
/* optional: smooth scroll */
iframe {
  background: #fff;
}

body.body--dark iframe {
  background: #1e1e1e;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>