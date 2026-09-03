<template>
  <q-page class="row items-center justify-evenly">

    <!-- =================================================
         OTP CONFIRMATION DIALOG
    ================================================== -->
    <q-dialog v-model="showOtpDialog" persistent>
      <s-card square flat bordered class="text-center otp-card">
        <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
          <div class="ellipsis">{{ identifier }}</div>
          <q-space />
          <s-btn dense flat icon="close" :disable="loading" v-close-popup @click="showOtpDialog = false">
            <q-tooltip>{{ tdc('Close') }}</q-tooltip>
          </s-btn>
        </q-bar>

        <q-card-section>
          <div class="text-subtitle2 q-mb-md">
            {{ tdc('Enter the code we sent to') }} {{ identifier }}
          </div>

          <OtpInput v-model="otp" :length="6" @complete="completeRegistration" />

          <div v-if="otpError" class="text-caption text-negative q-mt-sm">
            {{ otpError }}
          </div>

          <s-btn
            size="md"
            color="positive"
            dense
            class="full-width q-mt-lg"
            :disable="otp.length !== 6"
            :loading="loading"
            :label="tdc('Confirm')"
            @click="completeRegistration(otp)"
          />

          <s-btn
            flat
            size="sm"
            color="grey-7"
            dense
            class="full-width q-mt-sm"
            :disable="loading"
            :label="tdc('Resend code')"
            @click="requestOtp"
          />
        </q-card-section>
      </s-card>
    </q-dialog>

    <!-- =================================================
         PAGE
    ================================================== -->
    <div class="q-gutter-y-sm text-center register-wrap">
      <AllLogo v-if="showLoginLogo" />

      <s-card v-if="registered" flat square class="bg-positive text-white text-center">
        <q-card-section>
          {{ tdc('Account created successfully') }}
        </q-card-section>
      </s-card>

      <s-card flat square class="text-center bg-transparent register-card">
        <q-card-section class="text-left">
          <div class="text-h6 q-mb-md text-center">{{ tdc('Register') }}</div>

          <template v-if="!registered">
            <q-tabs
              v-model="channel"
              dense
              class="text-grey"
              active-color="primary"
              indicator-color="primary"
              align="justify"
              narrow-indicator
            >
              <q-tab name="email" icon="email" :label="tdc('Email')" />
              <q-tab name="mobile" icon="phone" :label="tdc('Phone')" />
            </q-tabs>

            <q-separator class="q-mb-md" />

            <q-form @submit.prevent="requestOtp">
              <s-input
                v-model="username"
                outlined
                dense
                clearable
                :readonly="loading"
                :label="tdc('Username')"
                :rules="[val => (val && val.length > 0) || tdc('This field is required')]"
              >
                <template #prepend>
                  <q-icon name="person" />
                </template>
              </s-input>

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
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </s-input>

              <div v-else class="row q-col-gutter-sm">
                <div class="col-12">
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
                </div>

                <div class="col-12">
                  <s-input
                    v-model="national"
                    outlined
                    dense
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

              <s-input
                v-model="password"
                outlined
                dense
                clearable
                :type="isPwd ? 'password' : 'text'"
                :readonly="loading"
                :label="tdc('Password')"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </s-input>

              <s-input
                v-model="confirmPassword"
                outlined
                dense
                clearable
                :type="isPwd ? 'password' : 'text'"
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

              <q-card-actions class="q-pa-none q-mt-md">
                <s-btn
                  type="submit"
                  unelevated
                  size="md"
                  color="primary"
                  class="full-width text-white"
                  :disable="!canRequestOtp"
                  :loading="loading"
                  :label="tdc('Register')"
                />
              </q-card-actions>
            </q-form>
          </template>

          <q-card-actions align="center" class="q-mt-sm">
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

import AllLogo from '../../components/AllLogo.vue'
import OtpInput from '../../components/OtpInput.vue'

import { useShowLoginLogo } from '../../composables/useShowLoginLogo'

export default defineComponent({
  name: 'RegisterPage',

  components: {
    AllLogo,
    OtpInput
  },

  setup () {
    const { showLoginLogo } = useShowLoginLogo()

    return { tdc, showLoginLogo }
  },

  data () {
    return {
      channel: 'email',

      username: '',
      email: '',
      dial: '258',
      national: '',
      password: '',
      confirmPassword: '',
      isPwd: true,

      identifier: '',
      otp: '',
      otpError: '',

      showOtpDialog: false,
      registered: false,
      loading: false
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

    passwordMismatch () {
      return !!this.confirmPassword && this.password !== this.confirmPassword
    },

    canRequestOtp () {
      if (this.loading) return false
      if (!this.username) return false
      if (!this.password || this.password.length < 8) return false
      if (this.password !== this.confirmPassword) return false
      return this.channel === 'email' ? !!this.email : this.isPhoneValid
    }
  },

  methods: {
    async requestOtp () {
      if (!this.canRequestOtp) return

      this.identifier = this.channel === 'email' ? this.email : this.fullPhoneNumber
      this.otp = ''
      this.otpError = ''
      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'register/otp/request/' }),
          { channel: this.channel, identifier: this.identifier }
        )

        this.showOtpDialog = true
      } catch (e) {
        // error toast already shown by the response interceptor
      } finally {
        this.loading = false
      }
    },

    async completeRegistration (otp) {
      if (!otp || otp.length !== 6) return

      this.loading = true
      this.otpError = ''

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'register/' }),
          {
            username: this.username,
            password: this.password,
            channel: this.channel,
            identifier: this.identifier,
            otp
          }
        )

        this.showOtpDialog = false
        this.registered = true
      } catch (e) {
        this.otpError = tdc('Invalid or expired code')
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.register-wrap {
  width: 100%;
  max-width: 360px;
}

.register-card {
  width: 100%;
}

.otp-card {
  width: min(360px, 92vw);
}
</style>
