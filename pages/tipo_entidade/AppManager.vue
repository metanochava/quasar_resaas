<template>
  <s-card class="column full-height modulo-card">

    <!-- 🔥 HEADER FIXO -->
    <div class="modulo-header">

      <q-bar class="bg-primary text-white">
        <q-icon name="view_module" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-bold">
          Gestão de Módulos
        </div>
        <q-space />
        <q-badge color="white" text-color="primary">
          {{ EntityType.selectedModulos.length }} ativos
        </q-badge>

        <s-btn dense flat icon="close" v-close-popup >
          <q-tooltip>{{ tdc('Close') }}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <!-- 🔍 SEARCH (FIXO) -->
      <div class="q-pa-sm bg-grey-2">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Pesquisar módulo..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

    </div>

    <!-- 🔥 LIST (SCROLL) -->
    <q-card-section class="modulo-body">

      <div v-if="EntityType.loadingModulos" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <q-list v-else separator bordered>

        <q-item
          v-for="mod in filteredModulos"
          :key="mod.id"
          clickable
          v-ripple
          class="modulo-item"
          :class="{ 'modulo-active': EntityType.hasModulo(mod.id) }"
          @click="EntityType.toggleModulo(mod)"
        >

          <!-- ICON -->
          <q-item-section avatar>
            <q-avatar
              :color="EntityType.hasModulo(mod.id) ? 'primary' : 'grey-4'"
              :text-color="EntityType.hasModulo(mod.id) ? 'white' : 'dark'"
              icon="extension"
            />
          </q-item-section>

          <!-- NAME -->
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ mod.nome }}
            </q-item-label>
          </q-item-section>

          <!-- STATUS -->
          <q-item-section side>
            <div class="row items-center q-gutter-sm">

              <q-chip
                dense
                size="sm"
                :color="EntityType.hasModulo(mod.id) ? 'primary' : 'grey-5'"
                text-color="white"
              >
                {{ EntityType.hasModulo(mod.id) ? 'Ativo' : 'Inativo' }}
              </q-chip>

              <q-checkbox
                :model-value="EntityType.hasModulo(mod.id)"
                @click.stop
                @update:model-value="() => EntityType.toggleModulo(mod)"
              />

            </div>
          </q-item-section>

        </q-item>

      </q-list>

      <!-- EMPTY -->
      <div
        v-if="!filteredModulos.length"
        class="text-center text-grey q-pa-md"
      >
        Nenhum módulo encontrado
      </div>

    </q-card-section>

  </s-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { tdc } from '../../boot/base'

const props = defineProps({
  entityTypeId: [String, Number]
})

const EntityType = useEntityTypeStore()

const search = ref('')

// 🔥 FILTER
const filteredModulos = computed(() => {
  const s = search.value.toLowerCase()

  if (!s) return EntityType.modulos

  return EntityType.modulos.filter(m =>
    (m.nome || '').toLowerCase().includes(s)
  )
})

// INIT
onMounted(() => {
  EntityType.loadModulos(props.entityTypeId)
})
</script>

<style scoped>
.modulo-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 🔥 HEADER FIXO */
.modulo-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 🔥 BODY COM SCROLL */
.modulo-body {
  flex: 1;
  overflow-y: auto;
}

/* 🔥 ITEM */
.modulo-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

/* 🔥 ITEM ATIVO */
.modulo-active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}
</style>