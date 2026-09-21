<template>
  <q-dialog v-model="permissionsModal" @hide="Permission.resetChanges">
    <s-modal-card
      :title="`${tdc('Permissions')} - ${groupLabel(Group.row)}`"
      icon="security"
      width="min(1100px, 90vw)"
      class="permissions-card"
    >
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
    </s-modal-card>
  </q-dialog>

  <s-modal-card :title="`${tdc('Manage Groups of')} ${Entity.row.name}`" icon="groups" fullscreen flush>
    <template #bar-actions>
      <q-badge color="white" text-color="primary">
        {{ Entity.selectedGroups.length }} {{ tdc('active') }}
      </q-badge>
    </template>

    <template #subheader>
      <div class="q-mb-sm">
      <div class="row q-col-gutter-sm items-center">
        <div class="col">
          <q-input
            v-model="newGroup"
            dense
            outlined
            clearable
            :label="tdc('New group')"
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
            :label="tdc('Add')"
            unelevated
            no-caps
            :disable="!canAdd"
            @click="addGroup"
          />
        </div>
      </div>
      </div>

      <q-input
        v-model="Entity.groupSearch"
        dense
        outlined
        clearable
        :label="tdc('Search group')"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>

    <div class="col scroll" style="min-height: 0;">
      <div
        v-if="Entity.loadingGroups"
        class="flex flex-center q-pa-xl"
      >
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator>
        <q-item
          v-for="group in Entity.filteredGroups || []"
          :key="group?.id"
          v-ripple
          clickable
          class="group-item"
          :class="{
            'group-item--active': Entity.hasGroup(group.id)
          }"
          @click="Entity.toggleGroup(group)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="
                Entity.hasGroup(group.id)
                  ? 'primary'
                  : 'grey-4'
              "
              :text-color="
                Entity.hasGroup(group.id)
                  ? 'white'
                  : 'dark'
              "
              icon="group"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ groupLabel(group) }}</q-item-label>
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
                  Entity.hasGroup(group.id)
                    ? 'primary'
                    : 'grey-5'
                "
                text-color="white"
              >
                {{
                  Entity.hasGroup(group.id)
                    ? tdc('Active')
                    : tdc('Inactive')
                }}
              </q-chip>

              <q-checkbox
                :model-value="Entity.hasGroup(group.id)"
                color="primary"
                @click.stop
                @update:model-value="Entity.toggleGroup(group)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </s-modal-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

import { useEntityStore } from '../../stores/EntityStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { useGroupStore } from '../../stores/GroupStore'
import { usePermissionStore } from '../../stores/PermissionStore'
import { HTTPAuth, url } from '../../services/api'

import { tdc } from '../../services/translation'
import { groupLabel } from '../../utils/groupLabel'

import PermissionManager from '../permission/PermissionManager.vue'

const props = defineProps({
  entityId: [String, Number]
})

const Entity = useEntityStore()
const EntityType = useEntityTypeStore()
const Group = useGroupStore()
const Permission = usePermissionStore()

const newGroup = ref('')
const permissionsModal = ref(false)
const permissions = ref([])
const ready = ref(false)

const canAdd = computed(() => Boolean(newGroup.value?.trim()))

async function openPermissions(group) {
  permissionsModal.value = true
  ready.value = false

  try {
    await Group.init()
    await Group.getById(group.id)

    const { data } = await HTTPAuth.get(
      url({
        type: 'u',
        url: `django_resaas/entitytypes/${Entity.form.entity_type.id}/permissions`
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

  await Entity.createGroup(name)
  newGroup.value = ''
}

onMounted(() => {
  Entity.loadGroups(props.entityId)
  EntityType.loadGroups(Entity.row.entity_type.id)
})
</script>

<style scoped>
.group-item {
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.group-item--active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}

.permissions-card {
  height: 80vh;
}
</style>