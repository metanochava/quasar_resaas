<script setup>
import { tdc } from '../../services/translation'

// One row of a ManagementPanel - purely presentational (icon + label +
// chevron), no store/API logic. Replaces the old pattern of a stack of
// full-width coloured s-btn for secondary/management actions (Groups,
// Theme Management, Apps, Models...) with a quieter list affordance
// more in line with settings panels in Stripe/GitHub/Linear.
defineProps({
  icon: { type: String, default: null },
  label: { type: String, required: true },
  disable: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<template>
  <div
    class="s-management-item"
    :class="{ 'is-disabled': disable }"
    @click="!disable && $emit('click')"
  >
    <q-icon v-if="icon" :name="icon" size="20px" class="s-management-item__icon" />
    <div class="s-management-item__label">{{ tdc(label) }}</div>
    <q-icon name="chevron_right" size="18px" class="s-management-item__chevron" />
  </div>
</template>

<style scoped>
.s-management-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.s-management-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.s-management-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.s-management-item__icon {
  opacity: 0.75;
  flex-shrink: 0;
}

.s-management-item__label {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 500;
}

.s-management-item__chevron {
  opacity: 0.4;
  flex-shrink: 0;
}
</style>
