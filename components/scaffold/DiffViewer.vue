<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { lineDiff } from '../../utils/lineDiff'

// Mega-prompt secção 34/35 - unified diff before Save/Apply. Purely
// presentational (utils/lineDiff.js does the actual computation).
const props = defineProps({
  path: { type: String, default: '' },
  original: { type: String, default: '' },
  modified: { type: String, default: '' },
})

const rows = computed(() => lineDiff(props.original, props.modified))

const stats = computed(() => ({
  added: rows.value.filter(r => r.type === 'added').length,
  removed: rows.value.filter(r => r.type === 'removed').length,
}))
</script>

<template>
  <div class="column full-height diff-viewer">
    <div class="row items-center q-gutter-sm q-pa-xs text-caption">
      <span class="text-weight-medium">{{ path }}</span>
      <q-badge color="positive">+{{ stats.added }}</q-badge>
      <q-badge color="negative">-{{ stats.removed }}</q-badge>
    </div>

    <q-separator />

    <div class="col scroll diff-body">
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="diff-row"
        :class="`diff-row--${row.type}`"
      >
        <span class="diff-marker">{{ row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' ' }}</span>
        <span class="diff-text">{{ row.text }}</span>
      </div>

      <div v-if="!rows.length" class="text-caption text-grey q-pa-md">
        {{ tdc('No differences') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-body {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 12px;
}

.diff-row {
  padding: 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-row--added {
  background: rgba(76, 175, 80, 0.15);
}

.diff-row--removed {
  background: rgba(244, 67, 54, 0.15);
}

.diff-marker {
  display: inline-block;
  width: 14px;
  opacity: 0.7;
}
</style>
