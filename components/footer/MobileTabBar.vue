<template>
  <!-- the phone's bottom bar (WhatsApp-like): the profile's tabs, already
       filtered by the backend (users/{id}/mobile_tabs/), then "More" (the
       drawer with every menu). Coloured like the footer (theme surface). -->
  <q-footer bordered class="mobile-tab-bar" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'" data-test="mobile-tab-bar">
    <q-tabs
      :model-value="active"
      dense no-caps switch-indicator
      align="justify" indicator-color="white" active-color="white"
      class="mobile-tab-bar__tabs"
    >
      <q-route-tab
        v-for="tab in tabs" :key="tab.route"
        :name="tab.route" :to="{ name: tab.route }" :icon="tab.icon" :label="tdc(tab.label)"
        class="mobile-tab-bar__tab" :data-test="`mobile-tab-${tab.route}`"
      />
      <q-tab name="__more" icon="menu" :label="tdc('More')" class="mobile-tab-bar__tab" data-test="mobile-tab-more" @click="User.toggleLeftTop()" />
    </q-tabs>
  </q-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'

const User = useUserStore()
const route = useRoute()
const tabs = computed(() => (User.MobileTabs || []).slice(0, 4))
const active = computed(() => (tabs.value.some(t => t.route === route.name) ? route.name : null))
</script>

<style scoped>
.mobile-tab-bar { padding-bottom: env(safe-area-inset-bottom); }
.mobile-tab-bar__tab { min-width: 0; padding: 0 4px; font-size: 11px; }
.mobile-tab-bar__tab :deep(.q-tab__label) { font-size: 11px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
