<script setup>
import { ref } from 'vue'

import ChangePasswordDialog from './ChangePasswordDialog.vue'
import TwoFactorCard from '../TwoFactorCard.vue'
import SecurityActivity from './SecurityActivity.vue'
import { computed } from 'vue'
import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'

// Security of the signed-in user's own account. Today the backend supports the
// password change; two-factor authentication, active sessions and security
// activity have NO API yet, so they are not shown (no fake data, no buttons that
// would call something that does not exist). `twoFactor` is the extension point:
// give it the backend's { policy, state } object and its card appears.
defineProps({
  twoFactor: { type: Object, default: null }
})

const passwordDialog = ref(false)

const Session = useUserStore()

// only what /me/ reports - never guessed
const passwordChangedAt = computed(() => {
  const at = Session.data?.password_changed_at
  return at ? new Date(at).toLocaleString() : ''
})
</script>

<template>
  <div data-test="account-security">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('Account security') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">{{ tdc('Keep your account protected.') }}</div>
    </div>

    <div class="column q-gutter-y-md">
      <s-card flat bordered class="security-card">
        <q-card-section class="row items-center no-wrap">
          <q-avatar size="44px" color="primary" text-color="white" icon="key" class="q-mr-md" />
          <div class="col">
            <div class="text-subtitle1">{{ tdc('Password') }}</div>
            <div class="text-caption text-grey-7">{{ tdc('Use a strong password that you do not use anywhere else.') }}</div>
            <div v-if="passwordChangedAt" class="text-caption q-mt-xs" data-test="password-changed-at">
              {{ tdc('Last changed') }}: {{ passwordChangedAt }}
            </div>
          </div>
          <s-btn outline dense no-caps color="primary" :label="tdc('Change')" data-test="open-password" @click="passwordDialog = true" />
        </q-card-section>
      </s-card>

      <SecurityActivity />

      <s-card v-if="twoFactor" flat bordered class="security-card">
        <q-card-section>
          <TwoFactorCard :two-factor="twoFactor" />
        </q-card-section>
      </s-card>
    </div>

    <ChangePasswordDialog v-model="passwordDialog" />
  </div>
</template>

<style scoped>
.security-card { transition: border-color .15s ease; }
.security-card:hover { border-color: var(--q-primary); }
</style>
