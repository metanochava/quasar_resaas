<template>

  <!-- 🔥 MODAL -->
  <q-dialog v-model="permissionsModal">

    <q-card class="modal-card">

      <!-- HEADER FIXO -->
      <div class="modal-header">
        <q-bar class="bg-primary text-white">
          <div class="text-subtitle2">
            Permissões - {{ Group?.row?.name }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>
        <q-separator />
      </div>

      <!-- BODY -->
      <q-card-section class="modal-body">

        <!-- LOADING -->
        <div v-if="!ready" class="flex flex-center q-pa-lg">
          <q-spinner size="40px" color="primary" />
        </div>

        <!-- CONTENT -->
        <PermissionManager
          v-else
          :AllPermissions="permissions"
          :GroupPermissionsRe="Group.row?.permissions || []"
          :Group="Group.row"
        />

      </q-card-section>

    </q-card>

  </q-dialog>

  <!-- 🔥 MAIN CARD -->
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

      <s-btn dense flat icon="close" v-close-popup>
        <q-tooltip>Close</q-tooltip>
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

    <!-- FILTER -->
    <q-card-section class="q-pa-md">
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
    </q-card-section>

    <q-separator />

    <!-- LIST -->
    <q-card-section class="col scroll q-pa-none">

      <div v-if="TipoEntidade.loadingGroups" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="42px" />
      </div>

      <q-list v-else separator>

        <q-item
          v-for="group in (TipoEntidade.filteredGroups || [])"
          :key="group?.id"
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
            <q-item-label>
              {{ group.name }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-sm">

              <!-- 🔥 BOTÃO MODAL -->
              <q-btn
                icon="security"
                size="sm"
                flat
                color="primary"
                @click.stop="openPermissions(group)"
              />

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

    </q-card-section>

  </s-card>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'
import { useGroupStore } from '../../stores/GroupStore'
import PermissionManager from '../permission/PermissionManager.vue'
import { HTTPAuth, url } from '../../boot/api'

const props = defineProps({
  tipoEntidadeId: [String, Number]
})

const TipoEntidade = useTipoEntidadeStore()
const Group = useGroupStore()

const newGroup = ref('')
const permissionsModal = ref(false)
const permissions = ref([])
const ready = ref(false)

// 🔥 ABRIR MODAL
async function openPermissions(group) {
  permissionsModal.value = true
  ready.value = false

  await Group.init()
  await Group.getById(group.id)

  const { data } = await HTTPAuth.get(
    url({ type: 'u', url: 'api/auth/permissions/' })
  )

  permissions.value = data || []

  ready.value = true
}

// 🔥 ADD GROUP
async function addGroup() {
  const name = newGroup.value?.trim()
  if (!name) return

  await TipoEntidade.createGroup(name)
  newGroup.value = ''
}

const canAdd = computed(() => newGroup.value?.trim().length > 0)

// INIT
onMounted(() => {
  TipoEntidade.loadGroups(props.tipoEntidadeId)
})
</script>

<style scoped>
.group-manager-card {
  overflow: hidden;
}

.group-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}

.modal-card {
  min-width: 70%;
  max-width: 90vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}
</style>