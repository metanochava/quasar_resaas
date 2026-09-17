<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="UserAdmin.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>
    <FormTwo
      v-else
      :store="UserAdmin"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    >
      <template #right v-if="UserAdmin.form?.id">
        <div class="q-gutter-md">
          <UserBranchesPanel :user-id="UserAdmin.form?.id" />
          <UserEntitiesPanel :user-id="UserAdmin.form?.id" />
          <UserPersonPanel :user-id="UserAdmin.form?.id" />
        </div>
      </template>
    </FormTwo>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserAdminStore } from '../../stores/UserAdminStore'
import FormTwo from '../../components/auto/FormTwo.vue'
import UserBranchesPanel from './UserBranchesPanel.vue'
import UserEntitiesPanel from './UserEntitiesPanel.vue'
import UserPersonPanel from './UserPersonPanel.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
// Dedicated admin store (stores/UserAdminStore.js) - see
// UserSEPage.vue's own note for why this isn't useUserStore().
const UserAdmin = useUserAdminStore()

// ---------------- STATE ----------------
const ready = ref(false)

// Same reasoning as UserSEPage.vue: password/email/mobile stay
// visible but readonly (backend schema, User.RESAAS.fields) - they
// can only ever be changed by their own owner, never through this
// generic admin form.
const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    UserAdmin.resetForm?.()
    return
  }


  // 🔥 avoids duplicate calls with a safe comparison
  if (String(UserAdmin.row?.id) === String(id)) {
    UserAdmin.form = UserAdmin.row
    return
  }

  UserAdmin.row = await UserAdmin.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await UserAdmin.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- WATCH ROUTE ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    await load(id)
  },
  { immediate: false }
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // console.log('Saved successfully', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
