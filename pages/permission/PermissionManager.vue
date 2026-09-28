<template>
  <!-- search and footer are static; only the list scrolls (the parent gives the height:
       a flush s-modal-card, or any flex column) -->
  <div class="permission-manager column no-wrap">
    <div class="q-pa-sm col-auto" data-test="permissions-search">
      <div class="row q-col-gutter-sm items-center">
        <div class="col">
          <q-input
            v-model="Permission.search"
            dense
            outlined
            :label="tdc('Search')"
            @update:model-value="Permission.buildApps"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <div class="col-auto">
          <q-badge color="primary" outline class="q-pa-sm">
            {{ Permission.groupPermissions.length }} permissions
          </q-badge>
        </div>
      </div>
    </div>

    <q-separator />

    <div class="permission-manager__list scroll q-pa-sm" data-test="permissions-list">
      <q-card
        v-for="(models, appName) in Permission.apps"
        :key="appName"
        class="q-mb-sm"
        flat
        bordered
      >
        <!-- while searching, every section with a match (the list only keeps
             matches) opens; the user can still close one -->
        <q-expansion-item
          expand-separator
          :model-value="!!opened[appName]"
          :data-test="`permissions-app-${appName}`"
          @update:model-value="opened[appName] = $event"
        >
          <template #header>
            <q-item-section avatar>
              <q-checkbox
                :model-value="Permission.appState(models).checked"
                :indeterminate="Permission.appState(models).indeterminate"
                :disable="Permission.loadingPermission"
                @update:model-value="Permission.toggleApp(models, $event)"
              />
            </q-item-section>

            <q-item-section>
              <div class="text-bold text-primary">
                <HighlightText :text="appName" :search="Permission.search" />
              </div>
              <div class="text-caption text-grey">
                {{ Object.keys(models).length }} {{ tdc('models') }}
              </div>
            </q-item-section>
          </template>

          <!-- one cell per model, sized to the screen -->
          <div class="row q-col-gutter-sm q-pa-sm">
            <div
              v-for="(perms, modelName) in models"
              :key="modelName"
              class="col-12 col-sm-6 col-md-4 col-xl-3"
            >
              <div class="permission-manager__model q-pa-sm full-height">
                <q-checkbox
                  :model-value="Permission.modelState(perms).checked"
                  :indeterminate="Permission.modelState(perms).indeterminate"
                  :disable="Permission.loadingPermission"
                  dense
                  @update:model-value="Permission.toggleModel(perms, $event)"
                >
                  <span class="text-bold">
                    <HighlightText :text="modelName" :search="Permission.search" />
                  </span>
                  <span class="text-grey q-ml-xs">{{ perms.length }}</span>
                </q-checkbox>

                <q-separator class="q-my-xs" />

                <div class="row q-col-gutter-xs">
                  <div
                    v-for="perm in orderPermissions(perms)"
                    :key="perm.id"
                    class="col-6"
                  >
                    <q-checkbox
                      :model-value="Permission.hasPermission(perm.id)"
                      :disable="Permission.loadingPermission"
                      :color="isMatch(perm, modelName) ? 'warning' : 'primary'"
                      dense
                      @update:model-value="Permission.toggle(perm)"
                    >
                      <HighlightText :text="label(perm.codename, modelName)" :search="Permission.search" />
                      <s-tooltip>{{ perm.codename }}</s-tooltip>
                    </q-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-expansion-item>
      </q-card>
    </div>

    <q-separator />
    <div class="q-pa-sm row items-center q-gutter-sm col-auto" data-test="permissions-footer">
      <div class="col">
        <div
          v-if="Permission.dirty"
          class="text-caption text-orange text-weight-medium"
        >
          <q-icon name="edit" class="q-mr-xs" />
          Unsaved permission changes
        </div>

        <div v-else class="text-caption text-positive">
          <q-icon name="check_circle" class="q-mr-xs" />
          Permissions saved
        </div>
      </div>

      <div class="col-auto">
        <s-btn
          flat
          no-caps
          icon="undo"
          label="Cancel changes"
          color="grey-7"
          :disable="!Permission.dirty || Permission.loadingPermission"
          @click="Permission.resetChanges"
        />
      </div>

      <div class="col-auto">
        <s-btn
          unelevated
          no-caps
          color="primary"
          icon="save"
          label="Save permissions"
          :loading="Permission.loadingPermission"
          :disable="!Permission.dirty || Permission.loadingPermission"
          @click="save"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { usePermissionStore } from '../../stores/PermissionStore'
import { tdc } from '../../services/translation'
import { matchesSearch } from '../../utils/highlight'
import HighlightText from '../../components/engine/HighlightText.vue'

const props = defineProps({
  AllPermissions: {
    type: Array,
    default: () => []
  },
  GroupPermissionsRe: {
    type: Array,
    default: () => []
  },
  Group: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['saved'])
const Permission = usePermissionStore()

watch(
  () => [
    props.AllPermissions,
    props.GroupPermissionsRe,
    props.Group
  ],
  ([allPermissions, groupPermissions, group]) => {
    Permission.initPermissions(
      allPermissions,
      groupPermissions,
      group
    )
  },
  { immediate: true }
)

// which app sections are open: all the (filtered) ones while searching,
// closed again when the search is cleared
const opened = reactive({})

watch(
  () => [Permission.search, Permission.apps],
  ([search]) => {
    for (const app of Object.keys(opened)) delete opened[app]
    if ((search || '').trim()) {
      for (const app of Object.keys(Permission.apps || {})) opened[app] = true
    }
  }
)

// a permission the search found by its own codename (not only by its model)
function isMatch(perm, modelName) {
  return matchesSearch(perm.codename, Permission.search) ||
    matchesSearch(label(perm.codename, modelName), Permission.search)
}

async function save() {
  if (await Permission.saveGroupPermissions()) {
    emit('saved', [...Permission.groupPermissions])
  }
}

const permissionOrder = [
  'add',
  'view',
  'change',
  'delete',
  'list',
  'pdf'
]

function orderPermissions(permissions) {
  return [...permissions].sort(
    (a, b) =>
      permissionOrder.findIndex((item) =>
        a.codename.includes(item)
      ) -
      permissionOrder.findIndex((item) =>
        b.codename.includes(item)
      )
  )
}

function label(codename, modelName) {
  const model = (modelName || '')
    .replaceAll(' ', '')
    .toLowerCase()

  return (codename || '')
    .toLowerCase()
    .replace(model, '')
    .replace(/_$/, '')
}
</script>

<style scoped>
/* fills the height it is given; the list takes what is left and scrolls */
.permission-manager {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.permission-manager__list {
  flex: 1 1 auto;
  min-height: 0;
}

.permission-manager__model {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
}

.body--dark .permission-manager__model {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
