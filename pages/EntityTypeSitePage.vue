<template>
  <div class="ets" :class="{ 'ets--dark': $q.dark.isActive }" data-test="entity-type-site">

    <!-- shared shell: the brand of this host's EntityType and the way in -->
    <header class="ets__bar">
      <div class="ets__brand" data-test="site-brand">
        <img v-if="iconUrl" :src="iconUrl" :alt="title" class="ets__logo">
        <span>{{ title }}</span>
      </div>

      <div class="ets__actions">
        <template v-if="signedIn">
          <s-btn
            unelevated rounded no-caps color="primary" icon="dashboard"
            :label="tdc('Open dashboard')" :to="{ name: 'dashboard' }" data-test="site-dashboard"
          />
        </template>
        <template v-else>
          <s-btn
            flat rounded no-caps color="primary"
            :label="tdc('Create Account')" :to="{ name: 'registarUser' }" data-test="site-register"
          />
          <s-btn
            unelevated rounded no-caps color="primary" icon="login"
            :label="tdc('Sign In')" :to="{ name: 'login' }" data-test="site-login"
          />
        </template>
      </div>
    </header>

    <main class="ets__main">
      <q-inner-loading :showing="loading" color="primary" />

      <!-- the body the application registered for this EntityType, or the generic one -->
      <component
        :is="body"
        v-if="!loading"
        :entity-type="entityType"
        :entity-types="entityTypes"
        :signed-in="signedIn"
      />
    </main>

    <footer class="ets__footer">
      © {{ year }} {{ title }} · {{ tdc('Powered by') }} <strong>RESAAS</strong>
    </footer>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, markRaw, onMounted, ref, shallowRef } from 'vue'
import { useQuasar } from 'quasar'
import { tdc } from '../services/translation'
import { getStorage } from '../services/storage'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import { getEntityTypeSite } from '../services/entityTypeSites'
import { findEntityType } from '../utils/entityTypeHost'
import EntityTypeDefaultSite from '../components/site/EntityTypeDefaultSite.vue'

// '/' of the app: the public site of the host's EntityType (resolved from the
// subdomain, utils/entityTypeHost.js). Public data only - the EntityType
// catalogue (name, label, icon) and its look (themeGet & co.), both PUBLIC
// reads of EntityTypeAPIView. An unknown host gets the list of sectors.

const $q = useQuasar()
const User = useUserStore()
const EntityType = useEntityTypeStore()

const loading = ref(true)
const entityTypes = ref([])
const entityType = ref(null)
const body = shallowRef(markRaw(EntityTypeDefaultSite))

const signedIn = computed(() => Boolean(User.isLogin || getStorage('l', 'access')))
const title = computed(() => tdc(entityType.value?.label || entityType.value?.name || 'RESAAS'))
const iconUrl = computed(() => entityType.value?.icon?.url || null)
const year = new Date().getFullYear()

onMounted(async () => {
  try {
    await EntityType.getEntityTypes()
    entityTypes.value = [...(EntityType.rows || [])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    entityType.value = findEntityType(entityTypes.value)

    if (entityType.value) {
      User.EntityType = entityType.value
      await EntityType.getLayoutSettings(entityType.value.id, { force: true })

      const loader = getEntityTypeSite(entityType.value.name)
      if (loader) body.value = markRaw(defineAsyncComponent(loader))
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ets {
  --ets-bg: #f6f8fc;
  --ets-text: #1d2433;
  --ets-muted: #5f6b80;
  --ets-bar: rgba(255, 255, 255, 0.82);

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--ets-bg);
  color: var(--ets-text);
}
.ets--dark {
  --ets-bg: #0e1220;
  --ets-text: #eef1f8;
  --ets-muted: #a3adc2;
  --ets-bar: rgba(14, 18, 32, 0.82);
}

.ets__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px clamp(16px, 4vw, 48px);
  background: var(--ets-bar);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid color-mix(in srgb, var(--ets-text) 8%, transparent);
}
.ets__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-size: 18px;
  font-weight: 800;
}
.ets__brand span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ets__logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
}
.ets__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ets__main {
  position: relative;
  flex: 1;
  min-height: 300px;
}

.ets__footer {
  padding: 20px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--ets-muted);
}

@media (max-width: 480px) {
  .ets__brand { font-size: 16px; }
}
</style>
