import { ref, computed } from 'vue'

import { HTTPAuth, url } from '../services/api'
import { useUserStore } from '../stores/UserStore'

// Changing the account's e-mail or mobile: the NEW value is only proven and
// applied by the backend after the code sent to it is confirmed
// (profile/contact/otp/request|confirm). One flow for both channels - the same
// endpoints the Account page has always used. Nothing is applied locally
// before the backend accepts the code; the code itself is wiped as soon as the
// flow ends (success, cancel) and never leaves this composable's local state.
//
// status: idle | sending | sent | confirming | invalid | resending | success
export function useContactOtp() {
  const Session = useUserStore()

  const status = ref('idle')
  const channel = ref('')
  const identifier = ref('')
  const otp = ref('')
  const errorMessage = ref('')

  const busy = computed(() => ['sending', 'confirming', 'resending'].includes(status.value))
  const active = computed(() => ['sent', 'confirming', 'invalid', 'resending'].includes(status.value))

  function wipe() {
    otp.value = ''
    errorMessage.value = ''
  }

  function reset() {
    status.value = 'idle'
    channel.value = ''
    identifier.value = ''
    wipe()
  }

  // returns true when the code was sent
  async function request(nextChannel, nextIdentifier, { resend = false } = {}) {
    if (!nextIdentifier) return false

    channel.value = nextChannel
    identifier.value = nextIdentifier
    wipe()
    status.value = resend ? 'resending' : 'sending'

    try {
      await HTTPAuth.post(
        url({ type: 'u', url: 'profile/contact/otp/request/' }),
        { channel: nextChannel, identifier: nextIdentifier }
      )

      status.value = 'sent'
      return true
    } catch {
      // the API client already alerts the backend's message
      status.value = resend ? 'sent' : 'idle'
      return false
    }
  }

  async function confirm(code = otp.value) {
    if (!code || code.length !== 6 || busy.value) return false

    status.value = 'confirming'
    errorMessage.value = ''

    try {
      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: 'profile/contact/otp/confirm/' }),
        { channel: channel.value, identifier: identifier.value, otp: code }
      )

      // only now, with the backend's answer, does the account change
      Session.data = { ...Session.data, ...data }

      const applied = channel.value
      status.value = 'success'
      wipe()
      return applied
    } catch {
      status.value = 'invalid'
      otp.value = ''
      return false
    }
  }

  return { status, channel, identifier, otp, errorMessage, busy, active, request, confirm, reset, wipe }
}
