import { ref } from 'vue'

import { HTTPAuth, url } from '../services/api'

// Two-factor authentication of the signed-in user's OWN account (the
// authenticated two_factor/* endpoints). Only the public STATE lives here:
// the secret, the QR and the recovery codes are handed straight to the caller
// (a dialog's local state) and are never kept in this composable, Pinia or any
// storage.
export function useTwoFactor() {
  const info = ref(null)
  const loading = ref(false)
  const failed = ref(false)

  const endpoint = (path) => url({ type: 'u', url: `two_factor/${path}` })

  async function load() {
    loading.value = true
    failed.value = false

    try {
      const { data } = await HTTPAuth.get(endpoint(''))
      info.value = data
    } catch {
      info.value = null
      failed.value = true
    } finally {
      loading.value = false
    }
  }

  // { secret, otpauth_uri, qr }
  async function begin() {
    const { data } = await HTTPAuth.post(endpoint('setup/'), {})
    return data
  }

  // -> recovery codes (shown once)
  async function confirm(code) {
    const { data } = await HTTPAuth.post(endpoint('confirm/'), { code })
    await load()
    return data.recovery_codes || []
  }

  async function disable(code) {
    await HTTPAuth.post(endpoint('disable/'), { code })
    await load()
  }

  // -> the new recovery codes (the old ones stop working)
  async function regenerate(code) {
    const { data } = await HTTPAuth.post(endpoint('recovery/'), { code })
    await load()
    return data.recovery_codes || []
  }

  return { info, loading, failed, load, begin, confirm, disable, regenerate }
}
