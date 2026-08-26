<template>
  <q-dialog v-model="dialog" full-width full-height>
    <s-card
      class="column no-wrap"
      style="height: 100vh;"
    >

      <!-- FIXED HEADER -->
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
          <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white text-14' : 'bg-primary text-white text-14'">{{ tdc('Download') }}</q-tooltip>

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
import { tdc } from '../services/translation'

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

// download
function downloadPdf() {
  if (pdfUrl.value) {
    window.open(pdfUrl.value, '_blank')
  }
}

// free memory (blob)
watch(() => props.modelValue, (val) => {
  if (!val && props.src?.startsWith('blob:')) {
    URL.revokeObjectURL(props.src)
  }
})
</script>

<style scoped>
/* optional: smooth scroll */
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