<template>
  <s-card class="column full-height app-card">

    <!-- 🔥 FIXED HEADER -->
    <div class="app-header">

      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
        <q-icon name="view_app" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">
          {{ tdc("Apps Management") }}
        </div>
        <q-space />
        <q-badge color="white" text-color="primary">
          {{ EntityType.selectedApps.length }} active
        </q-badge>

        <s-btn dense flat icon="close" v-close-popup >
          <q-tooltip>{{ tdc('Close') }}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <!-- 🔍 SEARCH (FIXED) -->
      <div class="q-pa-sm bg-grey-2">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Search module..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

    </div>

    <!-- 🔥 LIST (SCROLLING) -->
    <q-card-section class="app-body">

      <div v-if="EntityType.loadingApps" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
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

    </q-card-section>

  </s-card>
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
.app-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 🔥 FIXED HEADER */
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 🔥 SCROLLING BODY */
.app-body {
  flex: 1;
  overflow-y: auto;
}

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