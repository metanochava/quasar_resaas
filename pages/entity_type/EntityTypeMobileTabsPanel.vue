<template>
  <!-- This Entity Type's phone tabs (EntityTypeMobileTab), in order: the
       first 5 the profile may open are the bottom bar (mobile_tab_service).
       Same API as list_entitytypemobiletab, filtered by ?entity_type=. -->
  <s-card flat class="entity-type-panel" data-test="entity-type-mobile-tabs">
    <div class="panel-header" :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-icon name="tab" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Phone tabs') }}
      </div>
      <q-space />
      <q-badge color="white" text-color="primary" class="q-px-sm q-mr-sm">
        {{ tabs.length }}
      </q-badge>
      <s-btn
        v-if="canAdd"
        round dense flat color="white" icon="auto_awesome"
        :loading="seeding"
        data-test="mobile-tabs-seed"
        @click="seed"
      >
        <s-tooltip>{{ tdc('Add the tabs the active modules of this entity type suggest') }}</s-tooltip>
      </s-btn>
      <s-btn
        v-if="canAdd"
        round dense flat color="white" icon="add"
        data-test="mobile-tabs-add"
        @click="router.push({ name: 'add_entitytypemobiletab' })"
      >
        <s-tooltip>{{ tdc('Add') }} {{ tdc('entity type mobile tab') }}</s-tooltip>
      </s-btn>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <q-list v-else-if="tabs.length" separator>
      <q-item v-for="tab in tabs" :key="tab.id" data-test="mobile-tab-row">
        <q-item-section avatar>
          <q-avatar :color="tab.active ? 'primary' : 'grey-5'" text-color="white" size="36px">
            <q-icon :name="tab.icon || 'circle'" size="18px" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ tdc(tab.label) }}</q-item-label>
          <q-item-label caption>{{ tab.route }} · {{ tab.permission }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge v-if="!tab.active" color="grey-6" :label="tdc('Inactive')" />
        </q-item-section>

        <q-item-section v-if="canChange" side>
          <s-btn
            round dense flat color="primary" icon="edit"
            data-test="mobile-tab-edit"
            @click="router.push({ name: 'change_entitytypemobiletab', params: { id: tab.id } })"
          >
            <s-tooltip>{{ tdc('Edit') }}</s-tooltip>
          </s-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-center text-caption text-grey q-pa-lg" data-test="mobile-tabs-empty">
      <q-icon name="tab" size="32px" class="q-mb-xs" />
      <div>{{ tdc('No phone tabs yet.') }}</div>
    </div>
  </s-card>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'
import { Alert, AlertSuccess } from '../../boot/alerts'

const props = defineProps({
  entityTypeId: [String, Number]
})

const router = useRouter()
const User = useUserStore()

const tabs = ref([])
const loading = ref(false)
const seeding = ref(false)

// UX only: the backend checks every call
const canAdd = computed(() => User.can('add_entitytypemobiletab'))
const canChange = computed(() => User.can('change_entitytypemobiletab'))

async function load () {
  if (!props.entityTypeId) {
    tabs.value = []
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(url({
      type: 'u',
      url: 'django_resaas/entitytypemobiletabs/',
      params: { entity_type: props.entityTypeId, page_size: 100 }
    }))
    tabs.value = Array.isArray(data) ? data : (data?.results || [])
  } catch (error) {
    tabs.value = []
    Alert(error?.response)
  } finally {
    loading.value = false
  }
}

async function seed () {
  seeding.value = true

  try {
    await HTTPAuth.post(
      url({ type: 'u', url: 'django_resaas/entitytypemobiletabs/seed/' }),
      { entity_type: props.entityTypeId }
    )
    AlertSuccess(tdc('Tabs created'))
    await load()
  } catch (error) {
    Alert(error?.response)
  } finally {
    seeding.value = false
  }
}

watch(() => props.entityTypeId, load)
onMounted(load)
</script>

<style scoped>
.entity-type-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}
</style>
