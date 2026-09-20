import { ref, computed, watch } from 'vue'

import { useUserAdminStore } from '../stores/UserAdminStore'
import { useUserStore } from '../stores/UserStore'

// State + actions behind a "Profiles" panel: the Groups a user has in the
// CURRENT Entity/Branch, the Groups the Entity offers, and assign / remove.
//
// Nothing new is modelled here - it is the existing Group / EntityGroup /
// BranchUserGroup infrastructure (UserAPIView.userGroups/addGroup/
// removeGroup, EntityAPIView.groups) through UserAdminStore. The backend
// derives Entity/Branch from the signed RESAAS context and enforces
// permission + tenant scope on every call; this only drives the UI.
//
//   getUserId   () => the User's id (null when the person has no account)
//   enabled     () => false skips loading (the session may not list profiles)
export function useUserGroups(getUserId, { enabled = () => true } = {}) {
  const Users = useUserAdminStore()
  const Session = useUserStore()

  const assigned = ref([])
  const available = ref([])

  const loading = ref(false)
  const loadingAvailable = ref(false)
  const failed = ref(false)
  const availableFailed = ref(false)

  // group ids with a request in flight (their buttons show a spinner)
  const busy = ref(new Set())

  const count = computed(() => assigned.value.length)
  const assignedIds = computed(() => new Set(assigned.value.map(group => String(group.id))))

  const isAssigned = (group) => assignedIds.value.has(String(group?.id))
  const isBusy = (group) => busy.value.has(String(group?.id))

  function setBusy(group, on) {
    const next = new Set(busy.value)
    if (on) next.add(String(group.id))
    else next.delete(String(group.id))
    busy.value = next
  }

  // a newer load (another user, or a reload) makes an older answer stale
  let sequence = 0

  async function load() {
    const userId = getUserId()
    const mine = ++sequence

    if (!userId || !enabled()) {
      assigned.value = []
      failed.value = false
      loading.value = false
      return
    }

    loading.value = true
    failed.value = false

    try {
      const rows = await Users.fetchAssignedGroups(userId)

      if (mine === sequence) assigned.value = rows
    } catch {
      if (mine === sequence) {
        assigned.value = []
        failed.value = true
      }
    } finally {
      if (mine === sequence) loading.value = false
    }
  }

  async function loadAvailable() {
    const entityId = Session.Entity?.id
    if (!entityId) return

    loadingAvailable.value = true
    availableFailed.value = false

    try {
      available.value = await Users.fetchEntityGroups(entityId)
    } catch {
      available.value = []
      availableFailed.value = true
    } finally {
      loadingAvailable.value = false
    }
  }

  // Throws on failure (the caller shows the API's own message); the local
  // list only changes after the backend accepted the change.
  async function assign(group) {
    const userId = getUserId()
    if (!userId || isBusy(group)) return

    setBusy(group, true)

    try {
      await Users.assignGroup(userId, group.id)

      if (!isAssigned(group)) {
        assigned.value = [...assigned.value, { id: group.id, name: group.name, state: 'Active' }]
      }
    } finally {
      setBusy(group, false)
    }
  }

  async function unassign(group) {
    const userId = getUserId()
    if (!userId || isBusy(group)) return

    setBusy(group, true)

    try {
      await Users.unassignGroup(userId, group.id)

      assigned.value = assigned.value.filter(item => String(item.id) !== String(group.id))
    } finally {
      setBusy(group, false)
    }
  }

  // loads as soon as there is a user, and follows it: another employee (same
  // page instance) or an account that appears/disappears reloads the list
  watch(() => [getUserId(), enabled()], () => load(), { immediate: true })

  return {
    assigned, available, count,
    loading, loadingAvailable, failed, availableFailed,
    load, loadAvailable, assign, unassign,
    isAssigned, isBusy
  }
}
