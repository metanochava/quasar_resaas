<script setup>
import { computed } from 'vue'

import { tdc } from '../../services/translation'
import { AlertSuccess } from '../../boot/alerts'

// The one-time list of recovery codes: copy / download / print. The codes are
// props from the caller's local state - this component keeps nothing.
const props = defineProps({
  codes: { type: Array, default: () => [] }
})

const text = computed(() => props.codes.join('\n'))

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    AlertSuccess(tdc('Copied'))
  } catch {
    // clipboard blocked: the codes stay visible to be copied by hand
  }
}

function download() {
  const blob = new Blob([text.value + '\n'], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'recovery-codes.txt'
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <div class="column q-gutter-y-md" data-test="recovery-codes">
    <q-banner dense rounded class="bg-warning text-black">
      {{ tdc('Save these recovery codes somewhere safe. Each one works once, and they will not be shown again.') }}
    </q-banner>

    <div class="codes" data-test="recovery-list">
      <code v-for="code in codes" :key="code" class="code">{{ code }}</code>
    </div>

    <div class="row q-gutter-sm">
      <s-btn outline dense no-caps icon="content_copy" :label="tdc('Copy')" data-test="recovery-copy" @click="copy" />
      <s-btn outline dense no-caps icon="download" :label="tdc('Download')" data-test="recovery-download" @click="download" />
    </div>
  </div>
</template>

<style scoped>
.codes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.code {
  padding: 6px 10px;
  border: 1px dashed currentColor;
  border-radius: 6px;
  text-align: center;
  font-size: 15px;
  letter-spacing: .08em;
  user-select: all;
}
</style>
