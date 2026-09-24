<template>
  <q-page class="q-pa-sm">

    <!-- FORM -->
    <div v-if="Group.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>
    <FormTwo
      v-else
      :store="Group"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
      centerCol="col-4"
      rightCol="col-8"
    >

      <template #center v-if="Group.form?.id">
        <s-input
          label="Name"
          :modelValue="Group.form?.name"
        />
      </template>

      <template #right v-if="Group.form?.id">
        <PermissionsTransfer
          :base-path="`auth/groups/${Group.form.id}`"
          :file-name="`${Group.form.name}-permissions`"
          format="csv"
          pdf-action="permissions_pdf"
          data-action="permissions_csv"
          import-action="import_permissions"
          view-permission="view_group"
          change-permission="change_group"
          import-title="Import permissions (CSV)"
          import-hint="Use a CSV with a codename column (and app when a codename exists in several apps). A file downloaded here can be edited and imported back."
          @imported="loadGroupPermissions"
        />
        <PermissionManager
          :AllPermissions="permissions"
          :GroupPermissionsRe="Group.form.permissions"
          :Group="Group.form"
        />
      </template>

    </FormTwo>

  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupStore } from '../../stores/GroupStore.js'
import PermissionManager from '../permission/PermissionManager.vue'
import PermissionsTransfer from '../permission/PermissionsTransfer.vue'
import FormTwo from '../../components/auto/FormTwo.vue'
import { HTTPAuth, url } from '../../services/api.js'

const Group = useGroupStore()
const route = useRoute()

const ready = ref(false)

const permissions = ref([])

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at',
  'permissions'
]

// ---------------- PERMISSIONS ----------------
function canDo() {
  return true
}

// ---------------- LOAD GROUP ----------------
async function load(id) {
  if (!id) {
    Group.resetForm?.()
    return
  }

  if (String(Group.row?.id) === String(id)) {
    Group.form = Group.row
    await loadGroupPermissions()
    return
  }

  Group.row = await Group.getById(id)
  await loadGroupPermissions()
}

// The group's own permissions for PermissionManager: the group detail
// (GroupSerializer) doesn't carry them, so without this the page opened with
// nothing checked. Also reloaded after a CSV import.
async function loadGroupPermissions () {
  const id = Group.form?.id || route.params.id
  if (!id) return
  const { data } = await HTTPAuth.get(url({ type: 'u', url: `auth/groups/${id}/permissions/` }))
  Group.form = { ...Group.form, permissions: data || [] }
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Group.init()

    const id = route.params.id
    await load(id)

    // 🔥 FIRST: fetch permissions - PermissionManager needs the full
    // list to render its checkbox tree, not one page at a time -
    // page_size=0 (ResaasPagination) opts out of the pagination now in
    // place on auth/permissions/ (PermissionAPIView).
    const { data: all } = await HTTPAuth.get(
      url({ type: 'u', url: 'auth/permissions/', params: { page_size: 0 } })
    )

    permissions.value = all?.results || []

    // 🔥 ONLY THEN release the UI
    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- ROUTE CHANGE ----------------
watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    await load(id)
  }
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // optional
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>