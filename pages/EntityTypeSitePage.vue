<template>
  <q-page class="ets" data-test="entity-type-site">
    <q-inner-loading :showing="loading" color="primary" />

    <!-- the body the application registered for this EntityType, or the
         generic one; header and footer are the login's (AuthLayout) -->
    <component
      :is="body"
      v-if="!loading"
      :entity-type="entityType"
      :entity-types="entityTypes"
      :signed-in="signedIn"
      :has-entity="hasEntity"
      @logout="logout"
    />
  </q-page>
</template>

<script setup>
import { computed, defineAsyncComponent, markRaw, onMounted, ref, shallowRef } from 'vue'
import { getStorage } from '../services/storage'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import { getEntityTypeSite } from '../services/entityTypeSites'
import { findEntityType } from '../utils/entityTypeHost'
import EntityTypeDefaultSite from '../components/site/EntityTypeDefaultSite.vue'

// '/' of the app (in AuthLayout): the public site of the host's EntityType,
// also the start page of a signed-in user (Open dashboard, or - without an
// Entity - a notice and Sign out)
// (resolved from the subdomain, utils/entityTypeHost.js). Public data only -
// the EntityType catalogue (name, label, icon) and its look (themeGet & co.),
// PUBLIC reads of EntityTypeAPIView. An unknown host gets the list of sectors.

const User = useUserStore()
const EntityType = useEntityTypeStore()

const loading = ref(true)
const entityTypes = ref([])
const entityType = ref(null)
const body = shallowRef(markRaw(EntityTypeDefaultSite))

const signedIn = computed(() => Boolean(User.isLogin || getStorage('l', 'access')))
// signed in AND working in an Entity: the dashboard is reachable; signed in
// without one, the site says so (no Entity, no dashboard)
const hasEntity = computed(() => Boolean(User.Entity?.id))

async function logout () {
  await User.logout()
}

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
  position: relative;
  min-height: 300px;
}
</style>
