<script setup>
import { onMounted } from 'vue'

import { useAccountSessions } from '../../../composables/useAccountSessions'
import { tdc } from '../../../services/translation'

// Recent security events of THIS account: sign-ins and the changes its owner
// made (password, e-mail, phone). What an administrator does to the account is
// deliberately not listed here.
const { activity, loadingActivity, activityFailed, loadActivity } = useAccountSessions()

onMounted(loadActivity)

const KINDS = {
  login: { icon: 'login', label: 'Signed in' },
  PASSWORD_CHANGED: { icon: 'key', label: 'Password changed' },
  TEMPORARY_PASSWORD_CHANGED: { icon: 'key', label: 'Temporary password replaced' },
  EMAIL_CHANGED: { icon: 'mail', label: 'Email changed' },
  MOBILE_CHANGED: { icon: 'phone_iphone', label: 'Phone number changed' },
  TWO_FACTOR_ENABLED: { icon: 'shield', label: 'Two-factor authentication turned on' },
  TWO_FACTOR_DISABLED: { icon: 'shield_off', label: 'Two-factor authentication turned off' },
  TWO_FACTOR_RECOVERY_USED: { icon: 'vpn_key', label: 'Recovery code used' },
  TWO_FACTOR_RECOVERY_REGENERATED: { icon: 'autorenew', label: 'Recovery codes regenerated' }
}

const kind = (event) => KINDS[event.type] || { icon: 'info', label: 'Account activity' }
const when = (value) => (value ? new Date(value).toLocaleString() : '')
</script>

<template>
  <s-card flat bordered data-test="security-activity">
    <q-card-section class="text-subtitle1">{{ tdc('Recent activity') }}</q-card-section>
    <q-separator />

    <q-card-section v-if="loadingActivity" data-test="activity-loading">
      <q-skeleton v-for="n in 3" :key="n" type="text" class="q-mb-sm" />
    </q-card-section>

    <q-card-section v-else-if="activityFailed" class="text-center" data-test="activity-error">
      <div class="text-subtitle2">{{ tdc('Could not load the recent activity.') }}</div>
      <s-btn flat dense color="primary" icon="refresh" :label="tdc('Try again')" @click="loadActivity" />
    </q-card-section>

    <q-card-section v-else-if="!activity.length" class="text-grey-7" data-test="activity-empty">
      {{ tdc('No recent activity.') }}
    </q-card-section>

    <q-list v-else separator>
      <q-item v-for="(event, index) in activity" :key="index" data-test="activity-row">
        <q-item-section avatar>
          <q-icon :name="kind(event).icon" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ tdc(kind(event).label) }}<template v-if="event.device"> · {{ event.device }}</template></q-item-label>
          <q-item-label caption>{{ when(event.at) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </s-card>
</template>
