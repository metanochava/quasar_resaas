<template>
  <q-page class="row items-center justify-evenly">
    <div class="q-gutter-y-sm text-center forgot-wrap">
      <AllLogo v-if="showLoginLogo" />

      <s-card flat square class="text-center bg-transparent forgot-card" data-test="forgot-card">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md text-center">{{ tdc('Forgot my password') }}</div>

        <!-- ============ DONE (code path) ============ -->
        <div v-if="step === 'done'" class="text-center" data-test="forgot-done">
          <q-icon name="check_circle" color="positive" size="48px" />
          <div class="text-body2 q-mt-sm">{{ tdc('Password reset successfully') }}</div>
        </div>

        <!-- ============ LINK SENT ============ -->
        <div v-else-if="step === 'sent'" class="text-body2 q-mb-md" data-test="forgot-link-sent">
          {{ tdc('If this email or phone number is registered, a reset link was sent') }}
        </div>

        <!-- ============ CODE + NEW PASSWORD ============ -->
        <q-form v-else-if="step === 'code'" class="column q-gutter-y-sm" data-test="forgot-code-step" @submit.prevent="completeWithCode">
          <div class="text-subtitle2 text-center">
            {{ tdc('Enter the code we sent to') }} {{ identifier }}
          </div>

          <OtpInput v-model="otp" :length="6" />
          <div v-if="fieldErrors.otp" class="text-caption text-negative text-center" data-test="forgot-otp-error">{{ fieldErrors.otp }}</div>

          <s-input
            v-model="password"
            outlined
            dense
            :type="showPassword ? 'text' : 'password'"
            :readonly="loading"
            :label="tdc('New password')"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
            </template>
          </s-input>
          <div v-if="fieldErrors.password" class="text-caption text-negative">{{ fieldErrors.password }}</div>

          <s-input
            v-model="confirmPassword"
            outlined
            dense
            :type="showPassword ? 'text' : 'password'"
            :readonly="loading"
            :label="tdc('Confirm password')"
          >
            <template #prepend><q-icon name="lock" /></template>
          </s-input>
          <div v-if="passwordMismatch" class="text-caption text-negative">{{ tdc('Passwords do not match') }}</div>

          <s-btn
            type="submit"
            size="md"
            color="primary"
            dense
            class="full-width"
            :disable="otp.length !== 6 || !password || passwordMismatch || loading"
            :loading="loading"
            :label="tdc('Reset password')"
            data-test="forgot-reset"
          />
          <s-btn
            flat
            size="sm"
            color="grey-7"
            dense
            :disable="loading"
            :label="tdc('Resend code')"
            @click="requestReset"
          />
        </q-form>

        <!-- ============ REQUEST ============ -->
        <q-form v-else class="column q-gutter-y-sm" data-test="forgot-request-step" @submit.prevent="requestReset">
          <q-tabs
            v-model="channel"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="email" icon="email" :label="tdc('Email')" data-test="forgot-channel-email" />
            <q-tab name="mobile" icon="phone" :label="tdc('Phone')" data-test="forgot-channel-mobile" />
          </q-tabs>

          <s-input
            v-if="channel === 'email'"
            v-model="email"
            outlined
            dense
            clearable
            type="email"
            :readonly="loading"
            :label="tdc('Email')"
          >
            <template #prepend><q-icon name="email" /></template>
          </s-input>

          <template v-else>
            <s-select
              v-model="dial"
              outlined
              dense
              :options="countryOptions"
              emit-value
              map-options
              :readonly="loading"
              :label="tdc('Country')"
            />
            <s-input
              v-model="national"
              outlined
              dense
              clearable
              :readonly="loading"
              :label="tdc('Phone number')"
            >
              <template #prepend><q-icon name="phone" /></template>
            </s-input>
            <div v-if="national && !isPhoneValid" class="text-caption text-negative">{{ tdc('Invalid phone number') }}</div>
          </template>

          <div class="text-caption text-grey-7 q-mt-sm">{{ tdc('How do you want to recover it?') }}</div>
          <q-btn-toggle
            v-model="method"
            spread
            no-caps
            unelevated
            rounded
            toggle-color="primary"
            color="white"
            text-color="primary"
            class="forgot-method"
            :options="[
              { value: 'link', label: tdc('Receive a link'), icon: 'link' },
              { value: 'otp', label: tdc('Receive a code'), icon: 'pin' },
            ]"
            data-test="forgot-method"
          />

          <s-btn
            type="submit"
            size="md"
            color="primary"
            dense
            class="full-width q-mt-md"
            :disable="!canRequest || loading"
            :loading="loading"
            :label="method === 'link' ? tdc('Send reset link') : tdc('Send code')"
            data-test="forgot-send"
          />
        </q-form>

        <q-card-actions align="center" class="q-mt-md">
          <s-btn
            flat
            size="md"
            color="primary"
            :to="{ name: 'login' }"
            :label="tdc('Back to login')"
          />
        </q-card-actions>
      </q-card-section>
      </s-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

import { HTTPClient, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { COUNTRIES, countryLabel } from '../../utils/countries'
import { toE164, isValidE164 } from '../../utils/phone'
import { errorCode, errorMessage, parseFieldErrors } from '../../utils/apiContract'

import AllLogo from '../../components/AllLogo.vue'
import OtpInput from '../../components/OtpInput.vue'
import { useShowLoginLogo } from '../../composables/useShowLoginLogo'

// "Forgot my password" (PUBLIC, before a session): the account's e-mail or
// phone, and a link or a code - POST password/reset/request/. A link is
// finished on ResetPasswordConfirmPage (PATCH password/reset/complete/); a
// code here, with the new password (POST password/reset/otp/complete/).
export default defineComponent({
  name: 'ForgotPasswordPage',

  components: {
    AllLogo,
    OtpInput
  },

  setup() {
    const { showLoginLogo } = useShowLoginLogo()

    return { tdc, showLoginLogo }
  },

  data() {
    return {
      channel: 'email',
      method: 'link',
      email: '',
      dial: '258',
      national: '',
      identifier: '',
      otp: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      fieldErrors: {},
      loading: false,
      step: 'request'
    }
  },

  computed: {
    countryOptions () {
      return COUNTRIES.map(c => ({ label: countryLabel(c), value: c.dial }))
    },
    fullPhoneNumber () {
      return toE164(this.dial, this.national)
    },
    isPhoneValid () {
      return isValidE164(this.fullPhoneNumber)
    },
    canRequest () {
      return this.channel === 'email' ? !!this.email : this.isPhoneValid
    },
    passwordMismatch () {
      return !!this.confirmPassword && this.password !== this.confirmPassword
    }
  },

  methods: {
    async requestReset() {
      if (!this.canRequest) return

      this.identifier = this.channel === 'email' ? this.email : this.fullPhoneNumber
      this.fieldErrors = {}
      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'password/reset/request/' }),
          { channel: this.channel, identifier: this.identifier, method: this.method }
        )

        this.otp = ''
        this.step = this.method === 'link' ? 'sent' : 'code'
      } catch (e) {
        // error toast already shown by the response interceptor
        this.fieldErrors = parseFieldErrors(e?.response?.data)
      } finally {
        this.loading = false
      }
    },

    async completeWithCode() {
      if (this.otp.length !== 6 || !this.password || this.passwordMismatch || this.loading) return

      this.fieldErrors = {}
      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'password/reset/otp/complete/' }),
          { channel: this.channel, identifier: this.identifier, otp: this.otp, password: this.password }
        )

        this.step = 'done'
        setTimeout(() => this.$router.push({ name: 'login' }), 2500)
      } catch (e) {
        const fields = parseFieldErrors(e?.response?.data)
        if (errorCode(e) === 'too_many_attempts') fields.otp = errorMessage(e)
        this.fieldErrors = fields
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.forgot-wrap {
  width: 100%;
  max-width: 380px;
}

.forgot-method {
  border: 1px solid color-mix(in srgb, var(--q-primary) 35%, transparent);
}

.forgot-card {
  width: 100%;
  border-radius: 20px !important;
  /* a light glass card over the layout's translucent theme wash */
  background: rgba(255, 255, 255, 0.62) !important;
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 24px 60px -32px color-mix(in srgb, var(--q-primary) 55%, transparent);
}
.body--dark .forgot-card {
  background: rgba(22, 27, 45, 0.55) !important;
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
