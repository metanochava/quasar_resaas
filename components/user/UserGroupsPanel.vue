<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import { groupLabel } from '../../utils/groupLabel'
import { Alert, AlertSuccess } from '../../boot/alerts'
import { sDialog } from '../../services/dialog'

// The profiles (Groups) a user has in the CURRENT Entity - list, assign
// (modal) and remove (with confirmation). Reused as-is by any page that
// manages one user's access (view_employee's "Profiles" tab today).
//
// No new model or API: `controller` is useUserGroups(), which drives the
// existing Group/EntityGroup/BranchUserGroup endpoints. The buttons follow
// the session's effective permissions, but that is only UX - the backend
// checks tenant scope and permission on every call.
const props = defineProps({
  // useUserGroups() result
  controller: { type: Object, required: true },
  // false when the person has no user account yet
  hasUser: { type: Boolean, default: true },
  // shown in the messages ("Remove the profile X from <subject>?")
  subjectName: { type: String, default: '' }
})

const $q = useQuasar()
const Session = useUserStore()

const {
  assigned, available, loading, loadingAvailable, failed, availableFailed,
  load, loadAvailable, isAssigned, isBusy
} = props.controller

const entityName = computed(() => Session.Entity?.name || '')

// UX only - see above
const canList = computed(() => Session.can('list_branchusergroup'))
const canAssign = computed(() => Session.can('add_branchusergroup'))
const canRemove = computed(() => Session.can('delete_branchusergroup'))

// ---------------- assign (modal) ----------------
const dialogOpen = ref(false)
const search = ref('')

async function openAssign() {
  search.value = ''
  dialogOpen.value = true
  await loadAvailable()
}

const filteredAvailable = computed(() => {
  const text = search.value.trim().toLowerCase()

  return (available.value || []).filter(group =>
    !text || `${group.name || ''} ${groupLabel(group)}`.toLowerCase().includes(text)
  )
})

async function assign(group) {
  try {
    await props.controller.assign(group)
    AlertSuccess(tdc('Profile assigned successfully.'))
  } catch (error) {
    Alert(error?.response)
  }
}

// ---------------- remove (confirmation) ----------------
function confirmRemove(group) {
  sDialog({
    title: tdc('Remove profile'),
    message: `${tdc('Remove the profile')} "${groupLabel(group)}" ${tdc('from')} ${props.subjectName || tdc('this user')}?`
      + (entityName.value ? ` (${entityName.value})` : ''),
    persistent: true,
    ok: { label: tdc('Remove'), color: 'negative', flat: true },
    cancel: { label: tdc('Cancel'), flat: true }
  }).onOk(async () => {
    try {
      await props.controller.unassign(group)
      AlertSuccess(tdc('Profile removed successfully.'))
    } catch (error) {
      Alert(error?.response)
    }
  })
}
</script>

<template>
  <div class="user-groups-panel" data-test="user-groups-panel">

    <!-- header -->
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col">
        <div class="text-overline text-grey-7">{{ tdc('Profiles in the current entity') }}</div>
        <div v-if="entityName" class="row items-center no-wrap text-subtitle1 text-weight-medium">
          <q-icon name="business" class="q-mr-sm" /> {{ entityName }}
        </div>
      </div>

      <div v-if="hasUser && canAssign" class="col-auto">
        <s-btn
          unelevated
          color="primary"
          icon="add"
          :label="tdc('Assign profile')"
          data-test="assign-open"
          @click="openAssign"
        />
      </div>
    </div>

    <!-- no user account -->
    <div v-if="!hasUser" class="state-box" data-test="state-no-user">
      <q-icon name="no_accounts" size="32px" />
      <div class="text-subtitle2">{{ tdc('This person does not have a user account yet.') }}</div>
      <div class="text-caption">{{ tdc('Access profiles can only be assigned to users.') }}</div>
    </div>

    <!-- not allowed to see the profiles -->
    <div v-else-if="!canList" class="state-box" data-test="state-forbidden">
      <q-icon name="lock" size="32px" />
      <div class="text-subtitle2">{{ tdc('You do not have permission to view the profiles.') }}</div>
    </div>

    <!-- loading -->
    <div v-else-if="loading" class="state-box" data-test="state-loading">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="32px" />
    </div>

    <!-- error -->
    <div v-else-if="failed" class="state-box" data-test="state-error">
      <q-icon name="error_outline" size="32px" color="negative" />
      <div class="text-subtitle2">{{ tdc('Could not load the profiles.') }}</div>
      <s-btn flat dense color="primary" icon="refresh" :label="tdc('Try again')" data-test="retry" @click="load" />
    </div>

    <!-- empty -->
    <div v-else-if="!assigned.length" class="state-box" data-test="state-empty">
      <q-icon name="groups" size="32px" />
      <div class="text-subtitle2">{{ tdc('No profiles assigned in this entity.') }}</div>
    </div>

    <!-- list (one responsive layout for desktop and mobile) -->
    <q-list v-else bordered separator class="rounded-borders" data-test="profile-list">
      <q-item v-for="group in assigned" :key="group.id" data-test="profile-row">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" icon="group" size="40px" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ groupLabel(group) }}</q-item-label>
          <q-item-label caption>
            <q-chip dense square size="sm" color="positive" text-color="white" class="q-ma-none">
              {{ group.state === 'Inactive' ? tdc('Inactive') : tdc('Active') }}
            </q-chip>
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="canRemove" side>
          <s-btn
            flat dense no-caps
            color="negative"
            icon="person_remove"
            :label="tdc('Remove')"
            :loading="isBusy(group)"
            data-test="profile-remove"
            @click="confirmRemove(group)"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- assign modal (stays inside the page) -->
    <q-dialog v-model="dialogOpen">
      <s-modal-card :title="tdc('Assign profile')" icon="groups" width="520px" @close="dialogOpen = false">
        <div v-if="subjectName" class="text-caption text-grey-7 q-mb-sm">
          <q-icon name="person" size="16px" /> {{ subjectName }}
          <template v-if="entityName"> · <q-icon name="business" size="16px" /> {{ entityName }}</template>
        </div>

        <s-input
          v-model="search"
          dense
          outlined
          clearable
          type="search"
          :placeholder="tdc('Search profile')"
          class="q-mb-md"
          data-test="assign-search"
        />

        <div v-if="loadingAvailable" class="state-box" data-test="assign-loading">
          <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="28px" />
        </div>

        <div v-else-if="availableFailed" class="state-box" data-test="assign-error">
          <div class="text-subtitle2">{{ tdc('Could not load the profiles.') }}</div>
          <s-btn flat dense color="primary" icon="refresh" :label="tdc('Try again')" @click="loadAvailable" />
        </div>

        <div v-else-if="!filteredAvailable.length" class="state-box" data-test="assign-empty">
          <div class="text-subtitle2">{{ tdc('No results found') }}</div>
        </div>

        <q-list v-else separator>
          <q-item v-for="group in filteredAvailable" :key="group.id" data-test="assign-row">
            <q-item-section avatar>
              <q-icon :name="isAssigned(group) ? 'check_circle' : 'radio_button_unchecked'" :color="isAssigned(group) ? 'positive' : 'grey-6'" />
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ groupLabel(group) }}</q-item-label>
              <q-item-label v-if="isAssigned(group)" caption>{{ tdc('Already assigned') }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <s-btn
                v-if="!isAssigned(group)"
                unelevated dense no-caps
                color="primary"
                :label="tdc('Assign')"
                :loading="isBusy(group)"
                data-test="assign-btn"
                @click="assign(group)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </s-modal-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 16px;
  text-align: center;
  opacity: .8;
}
</style>
