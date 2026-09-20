import { ref, computed } from 'vue'

import { HTTPAuth, url } from '../services/api'

// The signed-in user's OWN sessions and recent security activity - the account
// endpoints (sessions/, security/activity/). Everything shown comes from the
// backend: devices are what the browser reported, nothing is inferred (no
// location), and nothing is invented while the backend has no answer.
export function useAccountSessions() {
  const sessions = ref([])
  const activity = ref([])

  const loading = ref(false)
  const failed = ref(false)
  const loadingActivity = ref(false)
  const activityFailed = ref(false)

  // session ids with a request in flight
  const busy = ref(new Set())
  const endingOthers = ref(false)

  const others = computed(() => sessions.value.filter(session => !session.current))

  async function load() {
    loading.value = true
    failed.value = false

    try {
      const { data } = await HTTPAuth.get(url({ type: 'u', url: 'sessions/' }))
      sessions.value = data?.data || []
    } catch {
      sessions.value = []
      failed.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadActivity() {
    loadingActivity.value = true
    activityFailed.value = false

    try {
      const { data } = await HTTPAuth.get(url({ type: 'u', url: 'security/activity/' }))
      activity.value = data?.data || []
    } catch {
      activity.value = []
      activityFailed.value = true
    } finally {
      loadingActivity.value = false
    }
  }

  function setBusy(id, on) {
    const next = new Set(busy.value)
    if (on) next.add(id)
    else next.delete(id)
    busy.value = next
  }

  // Throws on failure (the caller shows the backend's message); the list only
  // changes after the backend ended the session.
  async function terminate(session) {
    if (busy.value.has(session.id)) return

    setBusy(session.id, true)

    try {
      await HTTPAuth.post(url({ type: 'u', url: `sessions/${session.id}/terminate/` }), {})
      sessions.value = sessions.value.filter(item => item.id !== session.id)
    } finally {
      setBusy(session.id, false)
    }
  }

  async function terminateOthers() {
    if (endingOthers.value) return 0

    endingOthers.value = true

    try {
      const { data } = await HTTPAuth.post(url({ type: 'u', url: 'sessions/terminate_others/' }), {})
      sessions.value = sessions.value.filter(item => item.current)
      return data?.count ?? 0
    } finally {
      endingOthers.value = false
    }
  }

  return {
    sessions, others, activity,
    loading, failed, loadingActivity, activityFailed, busy, endingOthers,
    load, loadActivity, terminate, terminateOthers
  }
}
