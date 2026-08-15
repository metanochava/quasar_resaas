<template>
  <q-dialog v-model="dialog" full-width full-height>
    <s-card
      class="column no-wrap"
      style="height: 100vh;"
    >

      <!-- HEADER FIXO -->
      <q-bar v-show="top"
        class="pdf-header"
        :class="$q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-primary text-white'"
      >
        <div class="text-subtitle1">
          {{ title || 'Preview PDF' }}
        </div>

        <q-space />

        <!-- DOWNLOAD -->
        <s-btn
          v-if="pdfUrl"
          dense
          flat
          icon="download"
          @click="downloadPdf"
        >
          <q-tooltip>Download</q-tooltip>
        </s-btn>

        <!-- CLOSE -->
        <s-btn dense flat icon="close" @click="dialog = false" />
      </q-bar>

      <!-- BODY -->
      <q-card-section
        class="col q-pa-none"
        style="min-height: 0;"
      >
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          class="pdf-frame"
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
  title: String,
  top: Boolean
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

.pdf-header {
  flex: 0 0 auto;
  position: relative;
  z-index: 10;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>