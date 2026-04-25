<script setup>
import { onMounted } from 'vue'
import { useTipoEntidadeStore }  from './../../stores/TipoEntidadeStore'
import { tdc } from './../../boot/base'


const props = defineProps({
  tipoEntidadeId: {
    type: [String, Number],
    default: null
  }
})

const Store = useTipoEntidadeStore()

// ===============================
// INIT
// ===============================
onMounted(async () => {
  await Store.initPermissions(props.tipoEntidadeId)
})

// ===============================
// HELPERS
// ===============================
function formatName(value) {
  return (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function allSelected(models) {
  return models.every(m => Store.isSelected(m.id))
}

function toggleGroup(models, checked) {
  models.forEach(item => {
    const exists = Store.isSelected(item.id)

    if (checked && !exists) Store.togglePermission(item)
    if (!checked && exists) Store.togglePermission(item)
  })
}
</script>

<template>
  <q-page class="q-pa-md">

    <s-card class="column full-height">

      <!-- ================= HEADER ================= -->
      <q-card-section class="row items-center">

        <div>
          <div class="text-h5 text-weight-bold">
            {{ tdc('Gestão de Permissões') }}
          </div>
          <div class="text-caption text-grey-7">
            {{ tdc('Selecione os modelos permitidos') }}
          </div>
        </div>

        <q-space />

        <!-- 🔥 STATUS -->
        <div class="row items-center q-gutter-sm">

          <q-icon
            v-if="Store.permissions.status === 'saving'"
            name="sync"
            class="rotate"
          />

          <q-icon
            v-else-if="Store.permissions.status === 'saved'"
            name="check_circle"
            color="positive"
          />

          <q-icon
            v-else-if="Store.permissions.status === 'error'"
            name="error"
            color="negative"
          />

          <span class="text-caption">

            <span v-if="Store.permissions.status === 'saving'">
              {{ tdc('Salvando...') }}
            </span>

            <span v-else-if="Store.permissions.status === 'saved'">
              {{ tdc('Salvo') }}
            </span>

            <span v-else-if="Store.permissions.status === 'error'">
              {{ tdc('Erro ao salvar') }}
            </span>

            <span v-else>
              {{ tdc('Alterações pendentes') }}
            </span>

          </span>

        </div>

        <!-- 🔥 BOTÃO MANUAL -->
        <q-btn
          color="primary"
          icon="save"
          dense
          flat
          :loading="Store.permissions.savingPermissions"
          @click="Store.savePermissions(props.tipoEntidadeId)"
        />

      </q-card-section>

      <q-separator />

      <!-- ================= SEARCH ================= -->
      <q-card-section>
        <q-input
          v-model="Store.permissions.permissionSearch"
          outlined
          dense
          clearable
          :label="tdc('Pesquisar')"
          @update:model-value="Store.filterPermissions"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-separator />

      <!-- ================= LIST ================= -->
      <q-card-section class="col scroll">

        <div v-if="Store.permissions.loadingPermissions" class="flex flex-center q-pa-xl">
          <q-spinner size="40px" />
        </div>

        <q-list v-else separator>

          <q-expansion-item
            v-for="(models, app) in Store.groupedApps"
            :key="app"
            expand-separator
            icon="apps"
          >

            <!-- HEADER -->
            <template #header>
              <q-item-section avatar>
                <q-icon name="apps" color="primary" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{ formatName(app) }}
                </q-item-label>
                <q-item-label caption>
                  {{ models.length }} {{ tdc('modelos') }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-checkbox
                  :model-value="allSelected(models)"
                  @click.stop
                  @update:model-value="val => toggleGroup(models, val)"
                />
              </q-item-section>
            </template>

            <!-- ITEMS -->
            <q-item
              v-for="item in models"
              :key="item.id"
              clickable
              v-ripple
              @click="Store.togglePermission(item)"
            >
              <q-item-section avatar>
                <q-checkbox
                  :model-value="Store.isSelected(item.id)"
                  @click.stop
                  @update:model-value="() => Store.togglePermission(item)"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ formatName(item.model) }}
                </q-item-label>
                <q-item-label caption>
                  {{ item.app_label }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="Store.isSelected(item.id) ? 'primary' : 'grey'"
                  outline
                >
                  {{ Store.isSelected(item.id) ? tdc('Ativo') : tdc('Inativo') }}
                </q-badge>
              </q-item-section>

            </q-item>

          </q-expansion-item>

        </q-list>

      </q-card-section>

    </s-card>

  </q-page>
</template>

<style scoped>
.scroll {
  overflow-y: auto;
}

/* 🔥 animação */
.rotate {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>