<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

// Mega-prompt secção 20/73/74 - flat list of validation errors/
// warnings across every open tab, grouped by file, click -> jump to
// that file (and, when the editor position API is wired up by the
// parent, that line).
const props = defineProps({
  problems: { type: Array, default: () => [] },
})

const emit = defineEmits(['open'])

const grouped = computed(() => {
  const byPath = {}
  for (const p of props.problems) {
    if (!byPath[p.path]) byPath[p.path] = []
    byPath[p.path].push(p)
  }
  return Object.entries(byPath).map(([path, items]) => ({ path, items }))
})
</script>

<template>
  <div class="q-pa-sm problems-panel">
    <div v-if="!problems.length" class="text-caption text-grey q-pa-md">
      {{ tdc('No problems detected') }}
    </div>

    <div v-for="group in grouped" :key="group.path" class="q-mb-sm">
      <div class="text-weight-medium text-caption">{{ group.path }}</div>

      <div
        v-for="(item, i) in group.items"
        :key="i"
        class="row items-center q-gutter-xs problem-row"
        @click="emit('open', group.path, item.line)"
      >
        <q-icon
          :name="item.severity === 'error' ? 'error' : item.severity === 'warning' ? 'warning' : 'info'"
          :color="item.severity === 'error' ? 'negative' : item.severity === 'warning' ? 'warning' : 'grey-6'"
          size="16px"
        />
        <span v-if="item.line" class="text-caption text-grey">L{{ item.line }}</span>
        <span class="text-caption">{{ item.message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problems-panel {
  font-size: 12px;
}

.problem-row {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.problem-row:hover {
  background: rgba(128, 128, 128, 0.12);
}
</style>
