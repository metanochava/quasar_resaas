<template>
  <q-page class="row items-center justify-evenly">

    <!-- =================================================
         OTP CONFIRMATION DIALOG
    ================================================== -->
    <q-dialog v-model="showOtpDialog" persistent>
      <s-modal-card :title="identifier" icon="sms" width="360px" :close-disable="loading" @close="showOtpDialog = false">
        <div class="text-center">
          <div class="text-subtitle2 q-mb-md">
            {{ tdc('Enter the code we sent to') }} {{ identifier }}
          </div>

          <OtpInput v-model="otp" :length="6" @complete="completeRegistration" />

          <div v-if="otpError" class="text-caption text-negative q-mt-sm">
            {{ otpError }}
          </div>
        </div>

        <template #footer>
          <s-btn
            flat
            size="sm"
            color="grey-7"
            dense
            :disable="loading"
            :label="tdc('Resend code')"
            @click="requestOtp"
          />
          <s-btn
            size="md"
            color="positive"
            dense
            :disable="otp.length !== 6"
            :loading="loading"
            :label="tdc('Confirm')"
            @click="completeRegistration(otp)"
          />
        </template>
      </s-modal-card>
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
                v-model="name"
                outlined
                dense
                clearable
                :readonly="loading"
                :label="tdc('Full name')"
                data-test="register-name"
              >
                <template #prepend>
                  <q-icon name="badge" />
                </template>
              </s-input>

              <s-input
                :model-value="username"
                outlined
                dense
                clearable
                :readonly="loading"
                :label="tdc('Username')"
                :hint="tdc('Lowercase letters, digits, dots or underscores, starting with a letter')"
                data-test="register-username"
                @update:model-value="onUsernameInput"
              >
                <template #prepend>
                  <q-icon name="person" />
                </template>
                <template #append>
                  <q-spinner v-if="usernameStatus === 'checking'" size="18px" />
                  <q-icon v-else-if="usernameStatus === 'available'" name="check_circle" color="positive" />
                  <q-icon v-else-if="usernameStatus === 'taken' || usernameStatus === 'invalid'" name="error" color="negative" />
                </template>
              </s-input>

              <div class="text-caption q-mt-xs q-mb-sm" :class="statusClass" data-test="register-username-status">
                {{ statusText }}
                <a
                  v-if="usernameEdited && suggestions.length"
                  href="#"
                  class="q-ml-xs"
                  data-test="register-username-auto"
                  @click.prevent="useAutomaticSuggestion"
                >{{ tdc('Use the suggestion') }}</a>
              </div>

              <div v-if="visibleSuggestions.length" class="q-mb-sm" data-test="register-suggestions">
                <div class="text-caption text-grey-7">{{ tdc('Suggestions') }}</div>
                <q-chip
                  v-for="suggestion in visibleSuggestions"
                  :key="suggestion"
                  dense
                  clickable
                  :outline="suggestion !== username"
                  :color="suggestion === username ? 'primary' : undefined"
                  :text-color="suggestion === username ? 'white' : undefined"
                  :icon="availability[suggestion]?.available ? 'check' : undefined"
                  @click="chooseSuggestion(suggestion)"
                >{{ suggestion }}</q-chip>
              </div>

              <div v-if="fieldErrors.username" class="text-caption text-negative q-mb-sm">{{ fieldErrors.username }}</div>

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

              <div v-if="fieldErrors.identifier" class="text-caption text-negative q-mb-sm">{{ fieldErrors.identifier }}</div>

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

              <div v-if="fieldErrors.password" class="text-caption text-negative q-mb-sm">{{ fieldErrors.password }}</div>

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
import { errorCode, errorMessage, parseFieldErrors } from '../../utils/apiContract'
import { isValidUsername, normalizeUsername, usernameSuggestions } from '../../utils/usernameSuggestions'

// how long typing must pause before the backend is asked about usernames
const CHECK_DELAY_MS = 400
// the backend checks at most this many names per request
const MAX_CANDIDATES = 8

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

      name: '',
      username: '',
      // true once the user typed or picked a username: a new name then never
      // replaces it (useAutomaticSuggestion() goes back to the suggestions)
      usernameEdited: false,
      // name -> { valid, available } as answered by the backend (indicative)
      availability: {},
      checkState: 'idle', // idle | checking | error
      checkSeq: 0,
      checkTimer: null,
      fieldErrors: {},
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

    suggestions () {
      return usernameSuggestions(this.name)
    },

    // what is offered: never a name the backend said is taken
    visibleSuggestions () {
      return this.suggestions.filter(s => this.availability[s]?.available !== false).slice(0, 5)
    },

    usernameStatus () {
      const value = normalizeUsername(this.username)
      if (!value) return 'empty'
      if (!isValidUsername(value)) return 'invalid'
      const known = this.availability[value]
      if (known) return known.available ? 'available' : 'taken'
      if (this.checkState === 'checking') return 'checking'
      if (this.checkState === 'error') return 'unknown'
      return 'pending'
    },

    statusText () {
      return {
        invalid: tdc('Use 3 to 30 lowercase letters, digits, dots or underscores, starting with a letter'),
        available: tdc('Available'),
        taken: tdc('This username is already taken'),
        checking: tdc('Checking availability...'),
        unknown: tdc('Could not check availability now - it will be checked when you register'),
        pending: tdc('Suggestion - not checked yet')
      }[this.usernameStatus] || ''
    },

    statusClass () {
      return {
        available: 'text-positive',
        taken: 'text-negative',
        invalid: 'text-negative'
      }[this.usernameStatus] || 'text-grey-7'
    },

    passwordMismatch () {
      return !!this.confirmPassword && this.password !== this.confirmPassword
    },

    canRequestOtp () {
      if (this.loading) return false
      if (!isValidUsername(normalizeUsername(this.username))) return false
      // a server that cannot answer does not block: registration checks again
      if (this.usernameStatus === 'taken') return false
      if (!this.password || this.password.length < 8) return false
      if (this.password !== this.confirmPassword) return false
      return this.channel === 'email' ? !!this.email : this.isPhoneValid
    }
  },

  watch: {
    name () {
      if (!this.usernameEdited) this.username = this.firstFreeSuggestion()
      this.scheduleCheck()
    }
  },

  beforeUnmount () {
    clearTimeout(this.checkTimer)
  },

  methods: {
    firstFreeSuggestion () {
      return this.suggestions.find(s => this.availability[s]?.available !== false) || ''
    },

    onUsernameInput (value) {
      this.username = normalizeUsername(value)
      this.usernameEdited = true
      this.fieldErrors = { ...this.fieldErrors, username: '' }
      this.scheduleCheck()
    },

    chooseSuggestion (value) {
      this.username = value
      this.usernameEdited = true
      this.scheduleCheck()
    },

    useAutomaticSuggestion () {
      this.usernameEdited = false
      this.username = this.firstFreeSuggestion()
      this.scheduleCheck()
    },

    scheduleCheck () {
      clearTimeout(this.checkTimer)
      this.checkTimer = setTimeout(() => this.checkAvailability(), CHECK_DELAY_MS)
    },

    // asks about the typed username and the suggestions together; an answer
    // that arrives after a newer question is ignored
    async checkAvailability () {
      const typed = normalizeUsername(this.username)
      const names = [typed, ...this.suggestions]
        .filter((n, i, all) => n && isValidUsername(n) && all.indexOf(n) === i && !this.availability[n])
        .slice(0, MAX_CANDIDATES)
      if (!names.length) return

      const seq = ++this.checkSeq
      this.checkState = 'checking'
      try {
        const { data } = await HTTPClient.get(
          url({ type: 'u', url: 'register/username/', params: { candidates: names.join(',') } })
        )
        if (seq !== this.checkSeq) return
        const next = { ...this.availability }
        for (const row of data?.results || []) next[row.username] = { valid: row.valid, available: row.available }
        this.availability = next
        this.checkState = 'idle'
        if (!this.usernameEdited && this.availability[this.username]?.available === false) {
          this.username = this.firstFreeSuggestion()
        }
      } catch (e) {
        if (seq === this.checkSeq) this.checkState = 'error'
      }
    },

    async requestOtp () {
      if (!this.canRequestOtp) return

      this.identifier = this.channel === 'email' ? this.email : this.fullPhoneNumber
      this.otp = ''
      this.otpError = ''
      this.fieldErrors = {}
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
      // OtpInput now fires `complete` on the 6th digit, and the Confirm
      // button calls this too - never submit the same code twice
      if (!otp || otp.length !== 6 || this.loading) return

      this.loading = true
      this.otpError = ''

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'register/' }),
          {
            name: this.name,
            username: normalizeUsername(this.username),
            password: this.password,
            channel: this.channel,
            identifier: this.identifier,
            otp
          }
        )

        this.showOtpDialog = false
        this.registered = true
      } catch (e) {
        // the code itself was wrong (or tried too often): stay in the dialog
        const fields = parseFieldErrors(e?.response?.data)
        if (fields.otp || errorCode(e) === 'too_many_attempts') {
          this.otpError = fields.otp || errorMessage(e) || tdc('Invalid or expired code')
          return
        }
        // anything else belongs to a field of the form: back to it, nothing lost
        this.showOtpDialog = false
        this.fieldErrors = fields
        if (fields.username) {
          this.availability = { ...this.availability, [normalizeUsername(this.username)]: { valid: true, available: false } }
        }
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
