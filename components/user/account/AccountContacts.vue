<script setup>
import { ref, computed } from 'vue'

import ChangeEmailDialog from './ChangeEmailDialog.vue'
import ChangePhoneDialog from './ChangePhoneDialog.vue'
import { tdc } from '../../../services/translation'

// E-mail and phone as separate cards; each change opens its own OTP-confirmed
// dialog. "Verified" is shown only when /me/ reports the flag.
const props = defineProps({
  user: { type: Object, default: () => ({}) }
})

const emailDialog = ref(false)
const phoneDialog = ref(false)

const emailVerified = computed(() => (typeof props.user?.is_verified_email === 'boolean' ? props.user.is_verified_email : null))
const phoneVerified = computed(() => (typeof props.user?.is_verified_mobile === 'boolean' ? props.user.is_verified_mobile : null))
</script>

<template>
  <div data-test="account-contacts">
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-bold">{{ tdc('Contacts') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        {{ tdc('A new contact only takes effect after you confirm the verification code.') }}
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <s-card flat bordered class="contact-card">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="mail" size="22px" class="q-mr-sm" />
              <div class="text-subtitle1">{{ tdc('Email') }}</div>
            </div>

            <div class="text-body1 ellipsis" data-test="contact-email">{{ user?.email || tdc('Not set') }}</div>

            <q-chip v-if="emailVerified !== null && user?.email" dense square :icon="emailVerified ? 'verified' : 'error_outline'" :color="emailVerified ? 'positive' : 'warning'" text-color="white" class="q-ma-none q-mt-sm">
              {{ emailVerified ? tdc('Verified') : tdc('Not verified') }}
            </q-chip>
          </q-card-section>

          <q-card-actions align="right">
            <s-btn outline dense no-caps color="primary" icon="edit" :label="tdc('Change email')" data-test="open-email" @click="emailDialog = true" />
          </q-card-actions>
        </s-card>
      </div>

      <div class="col-12 col-md-6">
        <s-card flat bordered class="contact-card">
          <q-card-section>
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="phone_iphone" size="22px" class="q-mr-sm" />
              <div class="text-subtitle1">{{ tdc('Phone') }}</div>
            </div>

            <div class="text-body1" data-test="contact-phone">{{ user?.mobile || tdc('Not set') }}</div>

            <q-chip v-if="phoneVerified !== null && user?.mobile" dense square :icon="phoneVerified ? 'verified' : 'error_outline'" :color="phoneVerified ? 'positive' : 'warning'" text-color="white" class="q-ma-none q-mt-sm">
              {{ phoneVerified ? tdc('Verified') : tdc('Not verified') }}
            </q-chip>
          </q-card-section>

          <q-card-actions align="right">
            <s-btn outline dense no-caps color="primary" icon="edit" :label="tdc('Change phone number')" data-test="open-phone" @click="phoneDialog = true" />
          </q-card-actions>
        </s-card>
      </div>
    </div>

    <ChangeEmailDialog v-model="emailDialog" />
    <ChangePhoneDialog v-model="phoneDialog" />
  </div>
</template>

<style scoped>
.contact-card { height: 100%; transition: border-color .15s ease; }
.contact-card:hover { border-color: var(--q-primary); }
</style>
