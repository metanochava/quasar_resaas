<script setup>
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance, watch } from 'vue'

import AccountSidebar from '../../components/user/account/AccountSidebar.vue'
import AccountOverview from '../../components/user/account/AccountOverview.vue'
import AccountProfile from '../../components/user/account/AccountProfile.vue'
import AccountContacts from '../../components/user/account/AccountContacts.vue'
import AccountSecurity from '../../components/user/account/AccountSecurity.vue'
import AccountSessions from '../../components/user/account/AccountSessions.vue'
import AccountPreferences from '../../components/user/account/AccountPreferences.vue'

import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'

// Account Center of the signed-in user (route "account"). This page only
// orchestrates: it owns which section is showing and hands the user to each
// section, which owns its own state, requests and dialogs
// (components/user/account/). Sections stay mounted (keep-alive) so edits made
// in Profile survive a trip to another section.
//
// Every section is backed by a real endpoint (sessions/, security/activity/,
// two_factor/ ...): nothing is shown with invented data.
const Session = useUserStore()

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'contacts', label: 'Contacts', icon: 'alternate_email' },
  { id: 'sessions', label: 'Sessions', icon: 'devices' },
  { id: 'preferences', label: 'Preferences', icon: 'tune' }
]

const instance = getCurrentInstance()
// $route/$router without importing vue-router (the library does not depend on it)
const globals = instance?.proxy || {}

const initial = globals.$route?.query?.section
const section = ref(SECTIONS.some(item => item.id === initial) ? initial : 'overview')

// deep-linkable (?section=security) without owning the router
watch(section, (id) => {
  globals.$router?.replace?.({ query: { ...(globals.$route?.query || {}), section: id } })
})

const profileDirty = ref(false)

const sections = computed(() =>
  SECTIONS.map(item => (item.id === 'profile' ? { ...item, badge: profileDirty.value } : item))
)

const user = computed(() => Session.data || {})

const fullName = ref('')

const displayName = computed(() => fullName.value || user.value.username || '')

// closing/reloading the tab with unsaved profile edits
function warnBeforeLeaving(event) {
  if (!profileDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeLeaving))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving))
</script>

<template>
  <q-page class="q-pa-md account-page" data-test="account-page">
    <!-- A grid, not a content-sized row: the navigation keeps its width and the
         content always takes ALL the rest, so switching sections never makes the
         layout shrink and grow again. -->
    <div class="account-layout">

      <aside class="account-side">
        <s-card flat bordered class="account-nav-card">
          <AccountSidebar
            v-model="section"
            :sections="sections"
            :name="displayName"
            :username="user.username || ''"
            :email="user.email || ''"
            :avatar="Session.profile"
          />
        </s-card>
      </aside>

      <main class="account-main">
        <q-tab-panels
          v-model="section"
          keep-alive
          class="account-panels bg-transparent"
        >
          <q-tab-panel name="overview" class="q-pa-none">
            <AccountOverview :user="user" :name="displayName" @navigate="id => (section = id)" />
          </q-tab-panel>

          <q-tab-panel name="profile" class="q-pa-none">
            <AccountProfile @update:dirty="value => (profileDirty = value)" @update:name="value => (fullName = value)" />
          </q-tab-panel>

          <q-tab-panel name="security" class="q-pa-none">
            <AccountSecurity />
          </q-tab-panel>

          <q-tab-panel name="contacts" class="q-pa-none">
            <AccountContacts :user="user" />
          </q-tab-panel>

          <q-tab-panel name="sessions" class="q-pa-none">
            <AccountSessions />
          </q-tab-panel>

          <q-tab-panel name="preferences" class="q-pa-none">
            <AccountPreferences />
          </q-tab-panel>
        </q-tab-panels>
      </main>

    </div>
  </q-page>
</template>

<style scoped>
/* fills the area it is in (no max-width, no centring) */
.account-page { width: 100%; }

.account-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  width: 100%;
}

.account-side,
.account-main { min-width: 0; }

.account-nav-card { overflow: hidden; }
.account-panels { width: 100%; overflow: visible; }
.account-panels :deep(.q-panel) { width: 100%; }

@media (min-width: 1024px) {
  .account-layout { grid-template-columns: 300px minmax(0, 1fr); align-items: start; }
  .account-nav-card { position: sticky; top: 72px; }
}
</style>
