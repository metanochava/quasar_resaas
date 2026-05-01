<script setup>
import { onMounted } from 'vue'
import { useTipoEntidadeStore }  from '../../stores/TipoEntidadeStore'
import { tdc } from '../../boot/base'


const props = defineProps({
  tipoEntidadeId: {
    type: [String, Number],
    default: null
  }
})

const TipoEntidade = useTipoEntidadeStore()

// ===============================
// INIT
// ===============================
onMounted(async () => {
  await TipoEntidade.initPermissions(props.tipoEntidadeId)
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
  return models.every(m => TipoEntidade.isSelected(m.id))
}

function toggleGroup(models, checked) {
  models.forEach(item => {
    const exists = TipoEntidade.isSelected(item.id)

    if (checked && !exists) TipoEntidade.togglePermission(item)
    if (!checked && exissts) TipoEntidade.togglePermission(item)
  })
}
</script>
<template>

  <s-card class="column full-height">

    <!-- ================= HEADER FIXO ================= -->
    <q-bar class="row items-center bg-primary text-white">
      <div class="text-h6">
        {{ tdc("Gestão de App's e Modelos") }}
      </div>

      <q-space />

      <!-- STATUS -->
      <div class="row items-center q-gutter-sm">

        <q-icon v-if="TipoEntidade.permissions.status === 'saving'" name="sync" class="rotate" />
        <q-icon v-else-if="TipoEntidade.permissions.status === 'saved'" name="check_circle" color="positive" />
        <q-icon v-else-if="TipoEntidade.permissions.status === 'error'" name="error" color="negative" />

        <span class="text-caption">
          <span v-if="TipoEntidade.permissions.status === 'saving'">{{ tdc('Salvando...') }}</span>
          <span v-else-if="TipoEntidade.permissions.status === 'saved'">{{ tdc('Salvo') }}</span>
          <span v-else-if="TipoEntidade.permissions.status === 'error'">{{ tdc('Erro ao salvar') }}</span>
          <span v-else>{{ tdc('Alterações pendentes') }}</span>
        </span>

      </div>

      <s-btn dense flat icon="close" v-close-popup >
        <q-tooltip>{{ tdc('Close') }}</q-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <!-- ================= SEARCH FIXO ================= -->
    <q-card-section>
      <q-input
        v-model="TipoEntidade.permissions.permissionSearch"
        outlined
        dense
        clearable
        :label="tdc('Pesquisar')"
        @update:model-value="TipoEntidade.filterPermissions"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <!-- ================= SCROLL (APENAS AQUI) ================= -->
    <q-card-section class="col scroll">

      <div v-if="TipoEntidade.permissions.loadingPermissions" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" />
      </div>

      <q-list v-else separator>

        <q-expansion-item
          v-for="(models, app) in TipoEntidade.groupedApps"
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
            @click="TipoEntidade.togglePermission(item)"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="TipoEntidade.isSelected(item.id)"
                @click.stop
                @update:model-value="() => TipoEntidade.togglePermission(item)"
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
                :color="TipoEntidade.isSelected(item.id) ? 'primary' : 'grey'"
                outline
              >
                {{ TipoEntidade.isSelected(item.id) ? tdc('Ativo') : tdc('Inativo') }}
              </q-badge>
            </q-item-section>

          </q-item>

        </q-expansion-item>

      </q-list>

    </q-card-section>

  </s-card>

</template>