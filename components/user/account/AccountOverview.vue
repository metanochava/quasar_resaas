<script setup>
import { computed } from 'vue'

import { tdc } from '../../../services/translation'
import { maskEmail, maskPhone } from '../../../utils/maskContact'

// The first screen of the Account Center: a greeting and compact summary
// cards. Every fact shown comes from what /me/ really returns (e-mail, mobile,
// their verification flags, last sign-in). Nothing else is invented - no
// "password last changed" or "2FA active" until the backend reports them.
const props = defineProps({
  user: { type: Object, default: () => ({}) },
  name: { type: String, default: '' }
})

const emit = defineEmits(['navigate'])

const emailState = computed(() => flag(props.user?.is_verified_email))
const mobileState = computed(() => flag(props.user?.is_verified_mobile))

// true | false | null (null = the backend did not say)
function flag(value) {
  return typeof value === 'boolean' ? value : null
}

const passwordChanged = computed(() => {
  const at = props.user?.password_changed_at
  return at ? new Date(at).toLocaleString() : ''
})

const lastLogin = computed(() => {
  const at = props.user?.last_login
  return at ? new Date(at).toLocaleString() : ''
})

function stateChip(state) {
  if (state === true) return { icon: 'verified', color: 'positive', label: 'Verified' }
  if (state === false) return { icon: 'error_outline', color: 'warning', label: 'Not verified' }
  return null
}
</script>

<template>
  <div data-test="account-overview">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('My account') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        {{ tdc('Hello') }}<template v-if="name">, {{ name }}</template>.
        {{ tdc('Manage your data, security and preferences.') }}
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- e-mail -->
      <div class="col-12 col-sm-6">
        <s-card flat bordered class="overview-card cursor-pointer" tabindex="0" role="button" data-test="card-email"
                @click="emit('navigate', 'contacts')" @keyup.enter="emit('navigate', 'contacts')">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="alternate_email" size="22px" class="q-mr-sm" />
              <div class="text-subtitle2">{{ tdc('Email') }}</div>
            </div>
            <div class="text-body1 ellipsis" data-test="overview-email">{{ maskEmail(user?.email) || '—' }}</div>
            <q-chip v-if="stateChip(emailState)" dense square :icon="stateChip(emailState).icon" :color="stateChip(emailState).color" text-color="white" class="q-ma-none q-mt-sm" data-test="email-state">
              {{ tdc(stateChip(emailState).label) }}
            </q-chip>
          </q-card-section>
        </s-card>
      </div>

      <!-- phone -->
      <div class="col-12 col-sm-6">
        <s-card flat bordered class="overview-card cursor-pointer" tabindex="0" role="button" data-test="card-phone"
                @click="emit('navigate', 'contacts')" @keyup.enter="emit('navigate', 'contacts')">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="phone_iphone" size="22px" class="q-mr-sm" />
              <div class="text-subtitle2">{{ tdc('Phone') }}</div>
            </div>
            <div class="text-body1" data-test="overview-phone">{{ maskPhone(user?.mobile) || '—' }}</div>
            <q-chip v-if="stateChip(mobileState)" dense square :icon="stateChip(mobileState).icon" :color="stateChip(mobileState).color" text-color="white" class="q-ma-none q-mt-sm" data-test="phone-state">
              {{ tdc(stateChip(mobileState).label) }}
            </q-chip>
          </q-card-section>
        </s-card>
      </div>

      <!-- security -->
      <div class="col-12 col-sm-6">
        <s-card flat bordered class="overview-card cursor-pointer" tabindex="0" role="button" data-test="card-security"
                @click="emit('navigate', 'security')" @keyup.enter="emit('navigate', 'security')">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="shield" size="22px" class="q-mr-sm" />
              <div class="text-subtitle2">{{ tdc('Security') }}</div>
            </div>
            <div class="text-body2 text-grey-7">{{ tdc('Change your password and protect your account.') }}</div>
            <div v-if="passwordChanged" class="text-caption q-mt-sm" data-test="overview-password-changed">
              {{ tdc('Password last changed') }}: {{ passwordChanged }}
            </div>
          </q-card-section>
        </s-card>
      </div>

      <!-- last sign-in -->
      <div v-if="lastLogin" class="col-12 col-sm-6">
        <s-card flat bordered class="overview-card" data-test="card-last-login">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="history" size="22px" class="q-mr-sm" />
              <div class="text-subtitle2">{{ tdc('Last sign-in') }}</div>
            </div>
            <div class="text-body1">{{ lastLogin }}</div>
          </q-card-section>
        </s-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-card {
  height: 100%;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.overview-card:hover,
.overview-card:focus-visible {
  border-color: var(--q-primary);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--q-primary) 18%, transparent);
  outline: none;
}
</style>
