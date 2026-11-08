<template>
  <!-- A stored file as a card with a small preview of what the browser can
       show (image, PDF, text, video; audio plays here); a click opens it full
       screen, rendered by its type (anything else offers the download).
       Used by the lab results (dev/front FilePreviewDialog) and the documents
       of the person intake form. -->
  <div class="file-preview-card">
    <s-card
      v-if="url"
      flat bordered
      class="cursor-pointer"
      data-test="file-preview-file"
      @click="viewerOpen = true"
    >
      <!-- the overlay keeps the click for the full modal -->
      <div class="file-preview__thumb flex flex-center" :style="{ height: thumbHeight }" :data-test="`file-preview-thumb-${kind}`">
        <img v-if="kind === 'image'" :src="url" :alt="name" class="file-preview__thumb-image">
        <iframe v-else-if="kind === 'pdf'" :src="`${url}#toolbar=0&navpanes=0&view=FitH`" class="file-preview__thumb-frame" :title="name" tabindex="-1" />
        <iframe v-else-if="kind === 'text'" :src="url" class="file-preview__thumb-frame" :title="name" tabindex="-1" />
        <video v-else-if="kind === 'video'" :src="url" muted preload="metadata" class="file-preview__thumb-image" />
        <q-icon v-else :name="icon" size="72px" color="primary" />
        <div v-if="kind !== 'audio'" class="file-preview__thumb-overlay" />
      </div>
      <!-- audio: playable right here -->
      <audio v-if="kind === 'audio'" :src="url" controls class="full-width q-px-sm" @click.stop />
      <q-separator />
      <div class="q-pa-sm row items-center no-wrap q-gutter-x-xs">
        <div class="col ellipsis text-caption">{{ name }}</div>
        <slot name="actions" />
        <q-icon name="open_in_full" color="primary" />
      </div>
      <s-tooltip>{{ tdc('Open the file') }}</s-tooltip>
    </s-card>
    <slot v-else name="empty" />

    <!-- the file itself, full screen; only the body scrolls -->
    <q-dialog v-model="viewerOpen" persistent full-width full-height>
      <s-modal-card :title="name || tdc('Preview')" :icon="icon" fullscreen flush data-test="file-viewer" @close="viewerOpen = false">
        <template #bar-actions>
          <s-btn v-if="url" dense flat round icon="open_in_new" :href="url" target="_blank" rel="noopener">
            <s-tooltip>{{ tdc('Open in a new tab') }}</s-tooltip>
          </s-btn>
          <s-btn v-if="url" dense flat round icon="download" :href="url" :download="name || true">
            <s-tooltip>{{ tdc('Download') }}</s-tooltip>
          </s-btn>
        </template>

        <div class="col file-preview__body" :data-test="`file-preview-${kind}`">
          <img v-if="kind === 'image'" :src="url" :alt="name" class="file-preview__image">
          <iframe v-else-if="kind === 'pdf' || kind === 'text'" :src="url" class="file-preview__frame" :title="name" />
          <video v-else-if="kind === 'video'" :src="url" controls class="file-preview__media" />
          <audio v-else-if="kind === 'audio'" :src="url" controls class="file-preview__audio" />
          <div v-else class="column flex-center q-pa-xl text-center">
            <q-icon name="insert_drive_file" size="64px" color="grey-6" />
            <div class="q-mt-md">{{ tdc('This file cannot be previewed here.') }}</div>
            <s-btn v-if="url" class="q-mt-md" color="primary" icon="download" :label="tdc('Download')" :href="url" :download="name || true">
              <s-tooltip>{{ tdc('Download') }}</s-tooltip>
            </s-btn>
          </div>
        </div>
      </s-modal-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { tdc } from '../../services/translation'
import { fileUrl, fileName, fileKind, KIND_ICONS } from '../../utils/fileKind'

const props = defineProps({
  // see utils/fileKind.js for the accepted shapes
  file: { type: Object, default: null },
  thumbHeight: { type: String, default: '260px' }
})

const url = computed(() => fileUrl(props.file))
const name = computed(() => fileName(props.file))
const kind = computed(() => fileKind(props.file))
const icon = computed(() => KIND_ICONS[kind.value] || 'insert_drive_file')

const viewerOpen = ref(false)
watch(() => props.file?.id, () => { viewerOpen.value = false })

defineExpose({ open: () => { viewerOpen.value = true } })
</script>

<style scoped>
.file-preview__body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: auto;
  background: #f4f6f8;
}
.body--dark .file-preview__body { background: #1b1b1b; }
.file-preview__thumb {
  position: relative;
  overflow: hidden;
  background: #f4f6f8;
}
.file-preview__thumb-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  pointer-events: none;
}
.file-preview__thumb-overlay {
  position: absolute;
  inset: 0;
}
.body--dark .file-preview__thumb { background: #1b1b1b; }
.file-preview__thumb-image,
.file-preview__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.file-preview__frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}
.file-preview__media {
  max-width: 100%;
  max-height: 100%;
}
.file-preview__audio { width: min(560px, 90%); }
</style>
