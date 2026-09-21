<template>
  <s-modal-card :title="tdc('Apps Management')" icon="apps" fullscreen flush>
    <template #bar-actions>
      <q-badge color="white" text-color="primary">
        {{ EntityType.selectedApps.length }} active
      </q-badge>
    </template>

    <div class="col scroll" style="min-height: 0;">

      <div v-if="EntityType.loadingApps" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator bordered>

        <q-item
          v-for="mod in filteredApps"
          :key="mod.id"
          clickable
          v-ripple
          class="app-item"
          :class="{ 'app-active': EntityType.hasApp(mod.id) }"
          @click="EntityType.toggleApp(mod)"
        >

          <!-- ICON -->
          <q-item-section avatar>
            <q-avatar
              :color="EntityType.hasApp(mod.id) ? 'primary' : 'grey-4'"
              :text-color="EntityType.hasApp(mod.id) ? 'white' : 'dark'"
              icon="extension"
            />
          </q-item-section>

          <!-- NAME -->
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ mod.name }}
            </q-item-label>
          </q-item-section>

          <!-- STATUS -->
          <q-item-section side>
            <div class="row items-center q-gutter-sm">

              <q-chip
                dense
                size="sm"
                :color="EntityType.hasApp(mod.id) ? 'primary' : 'grey-5'"
                text-color="white"
              >
                {{ EntityType.hasApp(mod.id) ? 'Active' : 'Inactive' }}
              </q-chip>

              <q-checkbox
                :model-value="EntityType.hasApp(mod.id)"
                @click.stop
                @update:model-value="() => EntityType.toggleApp(mod)"
              />

            </div>
          </q-item-section>

        </q-item>

      </q-list>

      <!-- EMPTY -->
      <div
        v-if="!filteredApps.length"
        class="text-center text-grey q-pa-md"
      >
        No module found
      </div>

    </div>
  </s-modal-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { tdc } from '../../services/translation'

const props = defineProps({
  entityTypeId: [String, Number]
})

const EntityType = useEntityTypeStore()

const search = ref('')

// 🔥 FILTER
const filteredApps = computed(() => {
  const s = search.value.toLowerCase()

  if (!s) return EntityType.apps

  return EntityType.apps.filter(m =>
    (m.name || '').toLowerCase().includes(s)
  )
})

// INIT
onMounted(() => {
  EntityType.loadApps(props.entityTypeId)
})
</script>

<style scoped>
/* 🔥 ITEM */
.app-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

/* 🔥 ACTIVE ITEM */
.app-active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}
</style>