<template>
  <q-dialog v-model="permissionsModal" @hide="Permission.resetChanges">
    <q-card class="modal-card">
      <div class="modal-header">
        <q-bar :class="barClass">
          <div class="text-subtitle2">
            Permissions - {{ Group.row?.name }}
          </div>

          <q-space />
          <s-btn v-close-popup dense flat icon="close" />
        </q-bar>

        <q-separator />
      </div>

      <q-card-section class="modal-body">
        <div v-if="!ready" class="flex flex-center q-pa-lg">
          <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
        </div>

        <PermissionManager
          v-else
          :AllPermissions="permissions"
          :GroupPermissionsRe="Group.row?.permissions || []"
          :Group="Group.row"
          @saved="onPermissionsSaved"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <s-card class="column full-height group-manager-card">
    <q-bar :class="barClass">
      <q-icon name="groups" size="22px" />

      <div class="text-subtitle1 text-weight-bold q-ml-sm">
        Manage Groups of {{ EntityType.row.name }}
      </div>

      <q-space />

      <q-badge color="white" text-color="primary">
        {{ EntityType.selectedGroups.length }} active
      </q-badge>

      <s-btn v-close-popup dense flat icon="close">
        <s-tooltip>Close</s-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-sm items-center">
        <div class="col">
          <q-input
            v-model="newGroup"
            dense
            outlined
            clearable
            label="New group"
            @keyup.enter="addGroup"
          >
            <template #prepend>
              <q-icon name="group_add" />
            </template>
          </q-input>
        </div>

        <div class="col-auto">
          <s-btn
            color="primary"
            icon="add"
            label="Add"
            unelevated
            no-caps
            :disable="!canAdd"
            @click="addGroup"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <q-input
        v-model="EntityType.groupSearch"
        dense
        outlined
        clearable
        label="Search group"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <q-card-section class="col scroll q-pa-none">
      <div
        v-if="EntityType.loadingGroups"
        class="flex flex-center q-pa-xl"
      >
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator>
        <q-item
          v-for="group in EntityType.filteredGroups || []"
          :key="group?.id"
          v-ripple
          clickable
          class="group-item"
          :class="{
            'group-item--active': EntityType.hasGroup(group.id)
          }"
          @click="EntityType.toggleGroup(group)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="
                EntityType.hasGroup(group.id)
                  ? 'primary'
                  : 'grey-4'
              "
              :text-color="
                EntityType.hasGroup(group.id)
                  ? 'white'
                  : 'dark'
              "
              icon="group"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ group.name }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <s-btn
                icon="security"
                size="sm"
                flat
                color="primary"
                @click.stop="openPermissions(group)"
              />

              <q-chip
                dense
                size="sm"
                :color="
                  EntityType.hasGroup(group.id)
                    ? 'primary'
                    : 'grey-5'
                "
                text-color="white"
              >
                {{
                  EntityType.hasGroup(group.id)
                    ? 'Active'
                    : 'Inactive'
                }}
              </q-chip>

              <q-checkbox
                :model-value="EntityType.hasGroup(group.id)"
                color="primary"
                @click.stop
                @update:model-value="EntityType.toggleGroup(group)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </s-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useGroupStore } from '../../stores/GroupStore'
import { usePermissionStore } from '../../stores/PermissionStore'
import { HTTPAuth, url } from '../../services/api'

import PermissionManager from '../permission/PermissionManager.vue'

const props = defineProps({
  entityTypeId: [String, Number]
})

const $q = useQuasar()
const EntityType = useEntityTypeStore()
const Group = useGroupStore()
const Permission = usePermissionStore()

const newGroup = ref('')
const permissionsModal = ref(false)
const permissions = ref([])
const ready = ref(false)

const canAdd = computed(() => Boolean(newGroup.value?.trim()))
const barClass = computed(() =>
  $q.dark.isActive
    ? 'bg-dark text-white'
    : 'bg-primary text-white'
)

async function openPermissions(group) {
  permissionsModal.value = true
  ready.value = false

  try {
    await Group.init()
    await Group.getById(group.id)

    const { data } = await HTTPAuth.get(
      url({
        type: 'u',
        url: `django_resaas/entitytypes/${EntityType.form.id}/permissions`
      })
    )

    permissions.value = data || []
  } finally {
    ready.value = true
  }
}

function onPermissionsSaved(list) {
  if (Group.row) Group.row.permissions = [...list]
}

async function addGroup() {
  const name = newGroup.value?.trim()
  if (!name) return

  await EntityType.createGroup(name)
  newGroup.value = ''
}

onMounted(() => EntityType.loadGroups(props.entityTypeId))
</script>

<style scoped>
.group-manager-card {
  overflow: hidden;
}

.group-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}

.modal-card {
  display: flex;
  flex-direction: column;
  min-width: 70%;
  max-width: 90vw;
  height: 80vh;
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