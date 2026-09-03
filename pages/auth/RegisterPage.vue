<template>
  <q-page class="row items-center justify-evenly bg-transparent">
    <s-card flat square class="text-center bg-transparent register-card">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">{{ tdc('Register') }}</div>

        <q-form v-if="step === 1" @submit.prevent="requestOtp">
          <q-tabs
            v-model="channel"
            dense
            align="justify"
            class="q-mb-md"
          >
            <q-tab name="email" icon="email" :label="tdc('Email')" />
            <q-tab name="mobile" icon="phone" :label="tdc('Phone')" />
          </q-tabs>

          <q-separator class="q-mb-md" />

          <s-input
            v-if="channel === 'email'"
            v-model="email"
            outlined
            clearable
            type="email"
            :readonly="loading"
            :label="tdc('Email')"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </s-input>

          <div v-else class="row q-col-gutter-sm">
            <div class="col-5">
              <s-select
                v-model="dial"
                outlined
                :options="countryOptions"
                emit-value
                map-options
                :readonly="loading"
                :label="tdc('Country')"
              />
            </div>

            <div class="col-7">
              <s-input
                v-model="national"
                outlined
                clearable
                :readonly="loading"
                :label="tdc('Phone number')"
              >
                <template #prepend>
                  <q-icon name="phone" />
                </template>
              </s-input>
            </div>
          </div>

          <div
            v-if="channel === 'mobile' && national && !isPhoneValid"
            class="text-caption text-negative q-mb-sm"
          >
            {{ tdc('Invalid phone number') }}
          </div>

          <s-btn
            type="submit"
            size="md"
            color="positive"
            dense
            class="full-width q-mt-md"
            :disable="!canRequestOtp"
            :loading="loading"
            :label="tdc('Send code')"
          />
        </q-form>

        <q-form v-else @submit.prevent="completeRegistration">
          <div class="text-caption text-grey-7 q-mb-md">
            {{ tdc('Code sent to') }} {{ identifier }}
          </div>

          <s-input
            v-model="otp"
            outlined
            clearable
            :readonly="loading"
            :label="tdc('Verification code')"
          >
            <template #prepend>
              <q-icon name="pin" />
            </template>
          </s-input>

          <s-input
            v-model="username"
            outlined
            clearable
            :readonly="loading"
            :label="tdc('Username')"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </s-input>

          <s-input
            v-model="password"
            outlined
            clearable
            type="password"
            :readonly="loading"
            :label="tdc('Password')"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </s-input>

          <s-input
            v-model="confirmPassword"
            outlined
            clearable
            type="password"
            :readonly="loading"
            :label="tdc('Confirm password')"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </s-input>

          <div v-if="passwordMismatch" class="text-caption text-negative q-mb-sm">
            {{ tdc('Passwords do not match') }}
          </div>

          <s-btn
            type="submit"
            size="md"
            color="positive"
            dense
            class="full-width q-mt-md"
            :disable="!canCompleteRegistration"
            :loading="loading"
            :label="tdc('Create account')"
          />

          <s-btn
            flat
            size="sm"
            color="grey"
            class="full-width q-mt-sm"
            :disable="loading"
            :label="tdc('Change email or phone')"
            @click="step = 1"
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
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

import { HTTPClient, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { COUNTRIES, countryLabel } from '../../utils/countries'
import { toE164, isValidE164 } from '../../utils/phone'

export default defineComponent({
  name: 'RegisterPage',

  setup() {
    return { tdc }
  },

  data() {
    return {
      step: 1,
      channel: 'email',

      email: '',
      dial: '258',
      national: '',

      identifier: '',

      otp: '',
      username: '',
      password: '',
      confirmPassword: '',

      loading: false
    }
  },

  computed: {
    countryOptions() {
      return COUNTRIES.map(c => ({ label: countryLabel(c), value: c.dial }))
    },

    fullPhoneNumber() {
      return toE164(this.dial, this.national)
    },

    isPhoneValid() {
      return isValidE164(this.fullPhoneNumber)
    },

    canRequestOtp() {
      if (this.loading) return false
      if (this.channel === 'email') return !!this.email
      return this.isPhoneValid
    },

    passwordMismatch() {
      return !!this.confirmPassword && this.password !== this.confirmPassword
    },

    canCompleteRegistration() {
      return !!(
        this.otp &&
        this.username &&
        this.password &&
        this.password.length >= 8 &&
        this.password === this.confirmPassword &&
        !this.loading
      )
    }
  },

  methods: {
    async requestOtp() {
      if (!this.canRequestOtp) return

      this.identifier = this.channel === 'email' ? this.email : this.fullPhoneNumber
      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'register/otp/request/' }),
          { channel: this.channel, identifier: this.identifier }
        )

        this.step = 2
      } catch (e) {
        // error toast already shown by the response interceptor
      } finally {
        this.loading = false
      }
    },

    async completeRegistration() {
      if (!this.canCompleteRegistration) return

      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'register/' }),
          {
            username: this.username,
            password: this.password,
            channel: this.channel,
            identifier: this.identifier,
            otp: this.otp
          }
        )

        this.$router.push({ name: 'login' })
      } catch (e) {
        // error toast already shown by the response interceptor
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 340px;
}
</style>
