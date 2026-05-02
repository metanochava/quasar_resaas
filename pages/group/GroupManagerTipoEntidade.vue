<template>
  <s-card class="column full-height group-manager-card">

    <!-- HEADER -->
    <q-bar class="bg-primary text-white">
      <q-icon name="groups" size="22px" />

      <div class="text-subtitle1 text-weight-bold q-ml-sm">
        Gestão de Grupos
      </div>

      <q-space />

      <q-badge color="white" text-color="primary">
        {{ TipoEntidade.selectedGroups.length }} ativos
      </q-badge>

      <s-btn dense flat icon="close" v-close-popup >
        <q-tooltip>{{ tdc('Close') }}</q-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <!-- CREATE -->
    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-sm items-center">
        <div class="col">
          <q-input
            v-model="newGroup"
            dense
            outlined
            clearable
            label="Novo grupo"
            placeholder="Ex: Administrador, Gestor, Caixa..."
            @keyup.enter="addGroup"
          >
            <template #prepend>
              <q-icon name="group_add" />
            </template>
          </q-input>
        </div>

        <div class="col-auto">
          <q-btn
            color="primary"
            icon="add"
            label="Adicionar"
            unelevated
            no-caps
            :disable="!canAdd"
            @click="addGroup"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <!-- FILTERS -->
    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-sm items-center">

        <div class="col-12 col-md">
          <q-input
            v-model="TipoEntidade.groupSearch"
            dense
            outlined
            clearable
            label="Pesquisar grupo"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-12 col-md-auto">
          <q-btn-toggle
            v-model="TipoEntidade.groupFilter"
            dense
            unelevated
            no-caps
            color="grey-3"
            text-color="dark"
            toggle-color="primary"
            toggle-text-color="white"
            :options="[
              { label: 'Todos', value: 'all' },
              { label: 'Ativos', value: 'active' },
              { label: 'Inativos', value: 'inactive' }
            ]"
          />
        </div>

      </div>
    </q-card-section>

    <q-separator />

    <!-- CONTENT -->
    <q-card-section class="col scroll q-pa-none">

      <div
        v-if="TipoEntidade.loadingGroups"
        class="flex flex-center q-pa-xl"
      >
        <q-spinner color="primary" size="42px" />
      </div>

      <template v-else>
        <q-list separator>

          <q-item
            v-for="group in TipoEntidade.filteredGroups"
            :key="group.id"
            clickable
            v-ripple
            class="group-item"
            :class="{ 'group-item--active': TipoEntidade.hasGroup(group.id) }"
            @click="TipoEntidade.toggleGroup(group)"
          >

            <q-item-section avatar>
              <q-avatar
                :color="TipoEntidade.hasGroup(group.id) ? 'primary' : 'grey-4'"
                :text-color="TipoEntidade.hasGroup(group.id) ? 'white' : 'dark'"
                icon="group"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ group.name }}
              </q-item-label>

              <q-item-label caption>
                ID: {{ group.id }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">

                <q-chip
                  dense
                  size="sm"
                  :color="TipoEntidade.hasGroup(group.id) ? 'primary' : 'grey-5'"
                  text-color="white"
                >
                  {{ TipoEntidade.hasGroup(group.id) ? 'Ativo' : 'Inativo' }}
                </q-chip>

                <q-checkbox
                  :model-value="TipoEntidade.hasGroup(group.id)"
                  color="primary"
                  @click.stop
                  @update:model-value="() => TipoEntidade.toggleGroup(group)"
                />

              </div>
            </q-item-section>

          </q-item>

        </q-list>

        <div
          v-if="!TipoEntidade.filteredGroups.length"
          class="column flex-center q-pa-xl text-grey"
        >
          <q-icon name="search_off" size="46px" />
          <div class="text-subtitle2 q-mt-sm">
            Nenhum grupo encontrado
          </div>
          <div class="text-caption">
            Ajusta a pesquisa ou o filtro selecionado.
          </div>
        </div>
      </template>

    </q-card-section>

  </s-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'

const props = defineProps({
  tipoEntidadeId: [String, Number]
})

const TipoEntidade = useTipoEntidadeStore()
const newGroup = ref('')

const canAdd = computed(() => {
  return String(newGroup.value || '').trim().length > 0
})

onMounted(() => {
  TipoEntidade.loadGroups(props.tipoEntidadeId)
})

async function addGroup() {
  const name = String(newGroup.value || '').trim()
  if (!name) return

  await TipoEntidade.createGroup(name)
  newGroup.value = ''
}
</script>

<style scoped>
.group-manager-card {
  overflow: hidden;
}

.group-item {
  transition: background-color 0.2s ease, border-left 0.2s ease;
  border-left: 4px solid transparent;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}
</style>