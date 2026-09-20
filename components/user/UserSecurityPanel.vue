<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'

import { useUserAdminStore } from '../../stores/UserAdminStore'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import { Alert, AlertSuccess } from '../../boot/alerts'

// "Security" section of the User details: the state of the password and - only
// while it is still TEMPORARY - the explicit, permission-gated, audited way to
// read it back. A definitive password is never recoverable, so once the user
// has chosen one there is nothing to view (the button disappears).
//
// The temporary password is fetched by an explicit action, held ONLY in this
// dialog's local ref and wiped when it closes / the component goes away - never
// in Pinia, never in the normal user record. Buttons follow the session's
// permissions for UX; the backend enforces them (and tenant scope) on every call.
const props = defineProps({
  userId: { type: [String, Number], default: null },
  username: { type: String, default: '' }
})

const $q = useQuasar()
const Users = useUserAdminStore()
const Session = useUserStore()

const security = ref(null)
const loading = ref(false)
const failed = ref(false)

const revealed = ref('')
const dialogOpen = ref(false)
const busy = ref(false)

const canView = computed(() => Session.can('view_temporary_password'))
const canRegenerate = computed(() => Session.can('regenerate_temporary_password'))
const isSelf = computed(() => String(Session.data?.id) === String(props.userId))

const state = computed(() => security.value?.state || null)
const isTemporary = computed(() => state.value === 'temporary')

const stateLabel = computed(() => ({
  temporary: tdc('Temporary password'),
  expired: tdc('Temporary password expired'),
  permanent: tdc('Password set by the user')
}[state.value] || ''))

const expiresText = computed(() => {
  const at = security.value?.expires_at
  return at ? new Date(at).toLocaleString() : ''
})

async function load() {
  if (!props.userId) return

  loading.value = true
  failed.value = false

  try {
    security.value = await Users.fetchPasswordSecurity(props.userId)
  } catch {
    security.value = null
    failed.value = true
  } finally {
    loading.value = false
  }
}

watch(() => props.userId, load, { immediate: true })

// ---------- view / copy ----------
function wipe() {
  revealed.value = ''
}

async function reveal() {
  const data = await Users.viewTemporaryPassword(props.userId)
  security.value = { ...security.value, ...data, password: undefined }
  return data.password
}

async function openView() {
  busy.value = true

  try {
    revealed.value = await reveal()
    dialogOpen.value = true
  } catch (error) {
    Alert(error?.response)
    await load()
  } finally {
    busy.value = false
  }
}

async function copyFromCard() {
  busy.value = true

  try {
    const password = await reveal()
    await copyToClipboard(password)
    AlertSuccess(tdc('Password copied.'))
  } catch (error) {
    Alert(error?.response)
    await load()
  } finally {
    busy.value = false
  }
}

async function copyRevealed() {
  try {
    await copyToClipboard(revealed.value)
    AlertSuccess(tdc('Password copied.'))
  } catch {
    // clipboard unavailable: the value stays on screen to copy by hand
  }
}

// ---------- regenerate ----------
function confirmRegenerate() {
  $q.dialog({
    title: tdc('Generate a new temporary password'),
    message: tdc('The current temporary password will stop working and a new one will be created. Continue?'),
    persistent: true,
    ok: { label: tdc('Generate'), color: 'primary', flat: true },
    cancel: { label: tdc('Cancel'), flat: true }
  }).onOk(async () => {
    busy.value = true

    try {
      security.value = await Users.regenerateTemporaryPassword(props.userId)
      AlertSuccess(tdc('A new temporary password was generated.'))
    } catch (error) {
      Alert(error?.response)
      busy.value = false
      return
    }

    busy.value = false

    // showing it is a separate, audited action
    if (canView.value) await openView()
  })
}

onBeforeUnmount(wipe)
</script>

<template>
  <s-card flat bordered class="user-security" data-test="user-security">
    <q-card-section class="section-title row items-center q-gutter-sm">
      <q-icon name="shield" size="20px" />
      <span class="text-weight-medium">{{ tdc('Security') }}</span>
    </q-card-section>

    <q-separator />

    <q-card-section v-if="loading" class="row justify-center" data-test="security-loading">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="28px" />
    </q-card-section>

    <q-card-section v-else-if="failed" class="text-center" data-test="security-error">
      <div class="text-subtitle2">{{ tdc('Could not load the security details.') }}</div>
      <s-btn flat dense color="primary" icon="refresh" :label="tdc('Try again')" @click="load" />
    </q-card-section>

    <q-card-section v-else-if="security" class="column q-gutter-y-sm">
      <div v-if="username">
        <div class="field-label">{{ tdc('Username') }}</div>
        <div class="field-value">{{ username }}</div>
      </div>

      <div>
        <div class="field-label">{{ tdc('Password') }}</div>
        <div class="field-value">••••••••••••</div>
      </div>

      <div>
        <div class="field-label">{{ tdc('Status') }}</div>
        <q-chip
          dense square
          :color="isTemporary ? 'warning' : (state === 'expired' ? 'negative' : 'positive')"
          text-color="white"
          class="q-ma-none"
          data-test="security-state"
        >{{ stateLabel }}</q-chip>
      </div>

      <div v-if="expiresText">
        <div class="field-label">{{ tdc('Expires') }}</div>
        <div class="field-value" data-test="security-expires">{{ expiresText }}</div>
      </div>

      <div class="row q-gutter-sm q-mt-xs">
        <s-btn
          v-if="isTemporary && canView"
          outline dense no-caps
          icon="visibility"
          :label="tdc('View password')"
          :loading="busy"
          data-test="security-view"
          @click="openView"
        />
        <s-btn
          v-if="isTemporary && canView"
          outline dense no-caps
          icon="content_copy"
          :label="tdc('Copy')"
          :disable="busy"
          data-test="security-copy"
          @click="copyFromCard"
        />
      </div>

      <div v-if="canRegenerate && !isSelf">
        <s-btn
          unelevated dense no-caps
          color="primary"
          icon="autorenew"
          :label="tdc('Generate a new temporary password')"
          :disable="busy"
          data-test="security-regenerate"
          @click="confirmRegenerate"
        />
      </div>

      <div v-if="state === 'permanent'" class="text-caption text-grey-7">
        {{ tdc('The password chosen by the user cannot be viewed.') }}
      </div>
    </q-card-section>

    <!-- the password lives only here, only while open -->
    <q-dialog v-model="dialogOpen" persistent @hide="wipe">
      <s-card class="reveal-card">
        <q-card-section>
          <div class="text-h6">{{ tdc('Temporary password') }}</div>
          <div v-if="username" class="text-caption text-grey-7">{{ username }}</div>
        </q-card-section>

        <q-card-section>
          <div class="revealed" data-test="revealed-password">{{ revealed }}</div>

          <div class="row items-center no-wrap text-caption q-mt-md text-warning">
            <q-icon name="warning" size="18px" class="q-mr-xs" />
            {{ tdc('This is a sensitive credential.') }}
          </div>
        </q-card-section>

        <q-card-actions align="between">
          <s-btn flat no-caps icon="content_copy" :label="tdc('Copy')" data-test="reveal-copy" @click="copyRevealed" />
          <s-btn flat no-caps :label="tdc('Close')" data-test="reveal-close" @click="dialogOpen = false" />
        </q-card-actions>
      </s-card>
    </q-dialog>
  </s-card>
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
.reveal-card { width: 420px; max-width: 94vw; }
.revealed {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 22px;
  letter-spacing: .04em;
  padding: 12px 14px;
  border-radius: var(--s-radius, 8px);
  border: 1px dashed rgba(128, 128, 128, .5);
  word-break: break-all;
  user-select: all;
}
</style>
