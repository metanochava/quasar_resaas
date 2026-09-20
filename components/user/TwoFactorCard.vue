<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

// Two-factor authentication block of the Security section - PREPARED, not
// active: the backend has no 2FA/TOTP API yet (nothing to call, so nothing
// is invented here). It renders ONLY when the security details the backend
// already returns carry a `two_factor` object:
//
//   two_factor: {
//     policy: 'disabled' | 'optional' | 'required',       // the ORGANISATION's rule
//     state:  'not_configured' | 'configured' | 'active'  // this ACCOUNT's 2FA
//   }
//
// The two are different things and are shown separately. When the backend
// grows the setup endpoints, the QR/code dialog and the recovery-codes dialog
// hang off this card (their secrets must live only in the dialog's local
// state, never in Pinia/storage, exactly like the temporary password).
const props = defineProps({
  twoFactor: { type: Object, default: null }
})

const POLICY = {
  disabled: 'Disabled',
  optional: 'Optional',
  required: 'Required'
}

const STATE = {
  not_configured: 'Not configured',
  configured: 'Configured',
  active: 'Active'
}

const policyLabel = computed(() => POLICY[props.twoFactor?.policy] ? tdc(POLICY[props.twoFactor.policy]) : '')
const stateLabel = computed(() => STATE[props.twoFactor?.state] ? tdc(STATE[props.twoFactor.state]) : '')

const stateColor = computed(() => ({
  active: 'positive',
  configured: 'info',
  not_configured: props.twoFactor?.policy === 'required' ? 'negative' : 'grey-6'
}[props.twoFactor?.state] || 'grey-6'))
</script>

<template>
  <div v-if="twoFactor" class="column q-gutter-y-sm" data-test="two-factor">
    <q-separator />

    <div class="text-weight-medium">{{ tdc('Two-factor authentication') }}</div>

    <div>
      <div class="field-label">{{ tdc('Status') }}</div>
      <q-chip dense square :color="stateColor" text-color="white" class="q-ma-none" data-test="two-factor-state">
        {{ stateLabel }}
      </q-chip>
    </div>

    <div v-if="policyLabel">
      <div class="field-label">{{ tdc('Organisation policy') }}</div>
      <div class="field-value" data-test="two-factor-policy">{{ policyLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.field-label {
  font-size: 11px;
  letter-spacing: .06em;
  text-transform: uppercase;
  opacity: .6;
  margin-bottom: 2px;
}
.field-value { font-size: 15px; font-weight: 500; }
</style>
