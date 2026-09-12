<script setup>
import { tdc } from '../../services/translation'

// Presentational container for a list of ManagementItem rows - the
// "Management" side panel pattern used by pages like Entity/EntityType
// (Groups, Theme Management, Apps, Models...). No store/API logic.
defineProps({
  title: { type: String, default: 'Management' }
})
</script>

<template>
  <s-card flat bordered class="s-management-panel">
    <div class="s-management-panel__title">{{ tdc(title) }}</div>
    <q-separator class="q-mb-xs" />
    <div class="s-management-panel__list">
      <slot />
    </div>
  </s-card>
</template>

<style scoped>
.s-management-panel {
  padding: 12px;
}

.s-management-panel__title {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.6;
  padding: 4px 12px 8px;
}

.s-management-panel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
