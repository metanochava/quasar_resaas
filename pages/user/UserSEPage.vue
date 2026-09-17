<template>
  <q-page class="q-pa-sm">

    <!-- ===================================================== -->
    <!-- GROUPS -->
    <!-- ===================================================== -->

    <q-dialog v-model="openGroups" persistent full-height full-width>
      <GroupManagerUser :user-id="UserAdmin.form?.id" />
    </q-dialog>


    <!-- ===================================================== -->
    <!-- THEME STUDIO -->
    <!-- ===================================================== -->

    <q-dialog v-model="openTheme" persistent full-height full-width>
      <s-card class="q-pa-md">
        <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
          <q-toolbar-title>{{ tdc('Theme Management') }}</q-toolbar-title>
          <q-space />
          <s-btn dense flat round icon="close" @click="openTheme = false" />
        </q-bar>

        <q-separator />

        <ThemeStudioEngine
          scope="user"
          :allow-scope-select="false"
          :user="UserAdmin.form"
          :user-store="UserAdmin"
          :themes="Theme.rows"
          :layouts="LayoutSetting.rows"
          @saved="onThemeSaved"
        />
      </s-card>
    </q-dialog>


    <!-- ===================================================== -->
    <!-- NOTIFICATION PREFERENCES -->
    <!-- ===================================================== -->

    <q-dialog v-model="openNotifications" persistent>
      <UserNotificationPreferencesPanel :user-id="UserAdmin.form?.id" />
    </q-dialog>


    <!-- ===================================================== -->
    <!-- LOADING -->
    <!-- ===================================================== -->

    <div v-if="UserAdmin.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <!-- ===================================================== -->
    <!-- FORM -->
    <!-- ===================================================== -->

    <FormTwo
      v-else
      :store="UserAdmin"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    >

      <template #right v-if="UserAdmin.form?.id">
        <ManagementPanel>
          <ManagementItem
            icon="groups"
            :label="tdc('Groups')"
            @click="openGroups = true"
          />
          <ManagementItem
            icon="palette"
            :label="tdc('Theme Management')"
            @click="openThemeStudio"
          />
          <ManagementItem
            icon="forum"
            :label="tdc('Notification Preferences')"
            @click="openNotifications = true"
          />
        </ManagementPanel>

        <div class="q-mt-md q-gutter-md">
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
import { useThemeStore } from '../../stores/ThemeStore'
import { useLayoutSettingStore } from '../../stores/LayoutSettingStore'
import FormTwo from '../../components/auto/FormTwo.vue'
import ManagementPanel from '../../components/auto/ManagementPanel.vue'
import ManagementItem from '../../components/auto/ManagementItem.vue'
import GroupManagerUser from '../group/GroupManagerUser.vue'
import UserBranchesPanel from './UserBranchesPanel.vue'
import UserEntitiesPanel from './UserEntitiesPanel.vue'
import UserPersonPanel from './UserPersonPanel.vue'
import UserNotificationPreferencesPanel from './UserNotificationPreferencesPanel.vue'
import { ThemeStudioEngine } from '../../components/theme/index.js'
import { tdc } from '../../services/translation'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORES ----------------
// Dedicated admin store (stores/UserAdminStore.js) - NOT the session
// useUserStore(), which used to get its own .form/.row overwritten by
// whichever OTHER user was being edited here.
const UserAdmin = useUserAdminStore()
const Theme = useThemeStore()
const LayoutSetting = useLayoutSettingStore()

// ---------------- STATE ----------------
const ready = ref(false)
const openGroups = ref(false)
const openTheme = ref(false)
const openNotifications = ref(false)

// password/email/mobile can only ever be changed by their own owner,
// never by another user editing this form - enforced server-side
// (UserSerializer: 'password' isn't in Meta.fields at all - create()/
// update() both go through it, so it can never be set here either;
// 'email'/'mobile' are explicitly read_only - changing them requires
// the owner's own OTP-verified flow, data/user/views/
// profile_contact_otp.py). Kept visible but forced readonly generically
// by the backend schema (User.RESAAS.fields, see saas/models/user.py),
// which every field-rendering component already respects, so an admin
// can still see the current values without being invited to edit a
// field that would silently no-op on save.
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

// ---------------- THEME STUDIO ----------------
async function openThemeStudio() {
  if (!UserAdmin.form?.id) return

  await Promise.all([
    Theme.loadData?.({ page_size: 100 }),
    LayoutSetting.loadData?.({ page_size: 100 })
  ])

  openTheme.value = true
}

function onThemeSaved() {
  // no-op: ThemeStudioEngine already PATCHed UserAdmin.form directly
  // (see useThemeStudio.js's save()) - UserAdmin.form/.row already
  // reflect the new values.
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
