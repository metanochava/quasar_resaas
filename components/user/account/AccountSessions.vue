<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'

import { useAccountSessions } from '../../../composables/useAccountSessions'
import { tdc } from '../../../services/translation'
import { Alert, AlertSuccess } from '../../../boot/alerts'

// Where the account is signed in. The backend lists the sessions whose refresh
// token is still valid; ending one blacklists it. The current session cannot be
// ended here (that is "sign out").
const $q = useQuasar()
const account = useAccountSessions()

const { sessions, others, loading, failed, busy, endingOthers, load } = account

onMounted(load)

const when = (value) => (value ? new Date(value).toLocaleString() : '')

const iconFor = (device) => {
  if (/iOS|Android/.test(device)) return 'smartphone'
  return 'computer'
}

const canEndOthers = computed(() => others.value.length > 0)

function confirmEnd(session) {
  $q.dialog({
    title: tdc('End session'),
    message: `${tdc('End the session on')} ${session.device || tdc('Unknown device')}?`,
    persistent: true,
    ok: { label: tdc('End session'), color: 'negative', flat: true },
    cancel: { label: tdc('Cancel'), flat: true }
  }).onOk(async () => {
    try {
      await account.terminate(session)
      AlertSuccess(tdc('Session ended.'))
    } catch (error) {
      Alert(error?.response)
      await load()
    }
  })
}

function confirmEndOthers() {
  $q.dialog({
    title: tdc('End all other sessions'),
    message: tdc('You will be signed out everywhere except on this device. Continue?'),
    persistent: true,
    ok: { label: tdc('End all other sessions'), color: 'negative', flat: true },
    cancel: { label: tdc('Cancel'), flat: true }
  }).onOk(async () => {
    try {
      await account.terminateOthers()
      AlertSuccess(tdc('Other sessions ended.'))
    } catch (error) {
      Alert(error?.response)
      await load()
    }
  })
}
</script>

<template>
  <div data-test="account-sessions">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('Sessions') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">{{ tdc('Devices where your account is signed in.') }}</div>
    </div>

    <s-card flat bordered>
      <q-card-section v-if="loading" data-test="sessions-loading">
        <q-skeleton v-for="n in 3" :key="n" type="rect" height="52px" class="q-mb-sm" />
      </q-card-section>

      <q-card-section v-else-if="failed" class="text-center" data-test="sessions-error">
        <div class="text-subtitle2">{{ tdc('Could not load the sessions.') }}</div>
        <s-btn flat dense color="primary" icon="refresh" :label="tdc('Try again')" @click="load" />
      </q-card-section>

      <q-card-section v-else-if="!sessions.length" class="text-center text-grey-7" data-test="sessions-empty">
        {{ tdc('No active sessions.') }}
      </q-card-section>

      <q-list v-else separator data-test="sessions-list">
        <q-item v-for="session in sessions" :key="session.id" data-test="session-row">
          <q-item-section avatar>
            <q-avatar :icon="iconFor(session.device)" color="primary" text-color="white" size="40px" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ session.device || tdc('Unknown device') }}
              <q-chip v-if="session.current" dense square color="positive" text-color="white" icon="check_circle" class="q-ml-sm" data-test="session-current">
                {{ tdc('This session') }}
              </q-chip>
            </q-item-label>
            <q-item-label caption>{{ tdc('Signed in') }}: {{ when(session.created_at) }}</q-item-label>
          </q-item-section>

          <q-item-section v-if="!session.current" side>
            <s-btn
              flat dense no-caps
              color="negative"
              icon="logout"
              :label="tdc('End session')"
              :loading="busy.has(session.id)"
              data-test="session-end"
              @click="confirmEnd(session)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <template v-if="canEndOthers && !loading">
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <s-btn
            outline no-caps
            color="negative"
            icon="devices_other"
            :label="tdc('End all other sessions')"
            :loading="endingOthers"
            data-test="sessions-end-others"
            @click="confirmEndOthers"
          />
        </q-card-actions>
      </template>
    </s-card>
  </div>
</template>
