<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'

// Purely presentational grouping for form fields (CLAUDE.md-equivalent
// rule for this lib: no store/API/validation/schema logic here, ever -
// see docs/architecture equivalent notes on FormTwo.vue/FormComponent.vue).
// Used to give auto-generated and hand-written forms alike a labeled
// section instead of an unbroken list of inputs.
const props = defineProps({
  title: { type: String, default: null },
  subtitle: { type: String, default: null },
  icon: { type: String, default: null }
})

const User = useUserStore()
const layout = computed(() => User.ps?.layout || {})
</script>

<template>
  <div class="s-form-section" :class="{ 'is-dense': layout.dense }">
    <div v-if="title" class="s-form-section__header">
      <q-icon v-if="icon" :name="icon" size="18px" class="s-form-section__icon" />
      <div>
        <div class="s-form-section__title">{{ tdc(title) }}</div>
        <div v-if="subtitle" class="s-form-section__subtitle">{{ tdc(subtitle) }}</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.s-form-section {
  margin-bottom: 24px;
}

.s-form-section.is-dense {
  margin-bottom: 16px;
}

.s-form-section__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}

.s-form-section.is-dense .s-form-section__header {
  margin-bottom: 8px;
  padding-bottom: 6px;
}

.s-form-section__icon {
  opacity: 0.7;
  margin-top: 2px;
}

.s-form-section__title {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  opacity: 0.85;
}

.s-form-section__subtitle {
  font-size: 0.78rem;
  opacity: 0.6;
  margin-top: 2px;
}
</style>
