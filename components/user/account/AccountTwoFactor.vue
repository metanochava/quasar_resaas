<script setup>
import { ref, computed, onMounted } from 'vue'

import { useTwoFactor } from '../../../composables/useTwoFactor'
import { tdc } from '../../../services/translation'
import TwoFactorCard from '../TwoFactorCard.vue'
import TwoFactorSetupDialog from '../TwoFactorSetupDialog.vue'
import TwoFactorCodeDialog from '../TwoFactorCodeDialog.vue'
import RecoveryCodes from '../RecoveryCodes.vue'

// Two-factor authentication of the signed-in user's own account: what the
// backend reports (state + the effective policy of the organisation) and the
// actions it allows. The backend decides everything - `can_setup` /
// `can_disable` only shape the buttons, the endpoints enforce the rule.
const TwoFactor = useTwoFactor()

const setupOpen = ref(false)
const disableOpen = ref(false)
const regenerateOpen = ref(false)

// shown once after regenerating; wiped when closed
const freshCodes = ref([])
const codesOpen = computed({
  get: () => freshCodes.value.length > 0,
  set: (open) => { if (!open) freshCodes.value = [] }
})

const info = computed(() => TwoFactor.info.value)
const active = computed(() => info.value?.state === 'active')

// the card knows not_configured / configured / active; a half-finished setup is
// still "not configured" for the account
const cardData = computed(() => info.value
  ? { policy: info.value.policy, state: active.value ? 'active' : 'not_configured' }
  : null)

onMounted(() => TwoFactor.load())

async function regenerate(code) {
  freshCodes.value = await TwoFactor.regenerate(code)
}
</script>

<template>
  <s-card flat bordered class="security-card" data-test="account-two-factor">
    <q-card-section class="row items-center no-wrap">
      <q-avatar size="44px" color="primary" text-color="white" icon="phonelink_lock" class="q-mr-md" />
      <div class="col">
        <div class="text-subtitle1">{{ tdc('Two-factor authentication') }}</div>
        <div class="text-caption text-grey-7">
          {{ tdc('Ask for a code from your authenticator app every time you sign in.') }}
        </div>
      </div>
    </q-card-section>

    <q-card-section v-if="TwoFactor.loading.value && !info" class="text-center"><q-spinner size="24px" /></q-card-section>

    <q-card-section v-else-if="TwoFactor.failed.value" class="text-caption text-grey-7" data-test="two-factor-unavailable">
      {{ tdc('Could not load your two-factor settings.') }}
      <s-btn flat dense no-caps color="primary" :label="tdc('Try again')" @click="TwoFactor.load()" />
    </q-card-section>

    <template v-else-if="info">
      <q-card-section class="q-pt-none">
        <TwoFactorCard :two-factor="cardData" />

        <div v-if="active" class="text-caption q-mt-sm" data-test="recovery-remaining">
          {{ tdc('Recovery codes left') }}: {{ info.recovery_codes_remaining }}
        </div>

        <div v-if="info.policy === 'required' && !active" class="text-caption text-negative q-mt-sm" role="alert">
          {{ tdc('Your organisation requires two-factor authentication.') }}
        </div>

        <div v-if="info.policy === 'disabled' && !active" class="text-caption text-grey-7 q-mt-sm" data-test="two-factor-unavailable-policy">
          {{ tdc('Two-factor authentication is not available for your organisation.') }}
        </div>
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-md q-gutter-sm">
        <s-btn
          v-if="!active && info.can_setup"
          unelevated no-caps color="primary" icon="shield"
          :label="tdc('Enable')"
          data-test="two-factor-enable"
          @click="setupOpen = true"
        />

        <template v-if="active">
          <s-btn
            outline no-caps color="primary" icon="autorenew"
            :label="tdc('New recovery codes')"
            data-test="two-factor-regenerate"
            @click="regenerateOpen = true"
          />
          <s-btn
            v-if="info.can_disable"
            outline no-caps color="negative" icon="shield_off"
            :label="tdc('Disable')"
            data-test="two-factor-disable"
            @click="disableOpen = true"
          />
          <div v-else class="text-caption text-grey-7 self-center" data-test="two-factor-locked">
            {{ tdc('Your organisation requires two-factor authentication.') }}
          </div>
        </template>
      </q-card-actions>
    </template>

    <TwoFactorSetupDialog
      v-model="setupOpen"
      :begin="TwoFactor.begin"
      :confirm="TwoFactor.confirm"
      @finished="TwoFactor.load()"
    />

    <TwoFactorCodeDialog
      v-model="disableOpen"
      :title="tdc('Disable two-factor authentication')"
      :message="tdc('Enter a code to confirm. Your account will only be protected by its password.')"
      :action="tdc('Disable')"
      color="negative"
      :submit="TwoFactor.disable"
    />

    <TwoFactorCodeDialog
      v-model="regenerateOpen"
      :title="tdc('New recovery codes')"
      :message="tdc('Enter a code to confirm. Your current recovery codes will stop working.')"
      :action="tdc('Generate')"
      :submit="regenerate"
    />

    <q-dialog v-model="codesOpen" persistent>
      <s-card class="codes-dialog">
        <q-card-section class="text-h6">{{ tdc('Your new recovery codes') }}</q-card-section>
        <q-card-section><RecoveryCodes :codes="freshCodes" /></q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <s-btn unelevated no-caps color="primary" :label="tdc('Done')" data-test="codes-done" @click="codesOpen = false" />
        </q-card-actions>
      </s-card>
    </q-dialog>
  </s-card>
</template>

<style scoped>
.security-card { transition: border-color .15s ease; }
.security-card:hover { border-color: var(--q-primary); }
.codes-dialog { width: 420px; max-width: 94vw; }
</style>
