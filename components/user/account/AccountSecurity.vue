<script setup>
import { ref } from 'vue'

import ChangePasswordDialog from './ChangePasswordDialog.vue'
import AccountTwoFactor from './AccountTwoFactor.vue'
import SecurityActivity from './SecurityActivity.vue'
import { computed } from 'vue'
import { useUserStore } from '../../../stores/UserStore'
import { tdc } from '../../../services/translation'

// Security of the signed-in user's own account: password, recent security
// activity and two-factor authentication - everything comes from the backend.

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
          <q-avatar
            size="44px"
            color="primary"
            text-color="white"
            icon="key"
            class="q-mr-md"
          />

          <div class="col">
            <div class="text-subtitle1">
              {{ tdc('Password') }}
            </div>

            <div class="text-caption text-grey-7">
              {{ tdc('Use a strong password that you do not use anywhere else.') }}
            </div>

            <div
              v-if="passwordChangedAt"
              class="text-caption q-mt-xs"
              data-test="password-changed-at"
            >
              {{ tdc('Last changed') }}: {{ passwordChangedAt }}
            </div>
          </div>

          <s-btn
            outline
            dense
            no-caps
            color="primary"
            :label="tdc('Change')"
            data-test="open-password"
            @click="passwordDialog = true"
          />
        </q-card-section>
      </s-card>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <SecurityActivity />
        </div>

        <div class="col-12 col-md-6">
          <AccountTwoFactor />
        </div>
      </div>
    </div>

    <ChangePasswordDialog v-model="passwordDialog" />
  </div>
</template>

<style scoped>
.security-card { transition: border-color .15s ease; }
.security-card:hover { border-color: var(--q-primary); }
</style>
