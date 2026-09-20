<template>
  <div class="row items-center justify-evenly " :class="$q.dark.isActive ? 'bg-dark  ' : 'bg-transparent ' ">
    <s-card flat square class="text-center bg-transparent login-card" :class="$q.dark.isActive ? 'bg-dark  ' : 'bg-transparent ' ">
      <AllLogo v-if="showLoginLogo" />

      <q-card-section class="text-left">
        <s-card
          v-if="User.loginMsg === 'error'"
          class="bg-red text-white" 
        >
          <q-card-section>
            <div v-if="User.loginDetail" class="text-subtitle2">
              {{ User.loginDetail }}
            </div>
            <div v-else class="text-subtitle2">
              {{ tdc('Incorrect username or password entered') }}
              <br>
              {{ tdc('Please try again') }}
            </div>
          </q-card-section>
        </s-card>

        <s-card
          v-if="User.loginMsg === 'good'"
          class="bg-green text-white"
        >
          <q-card-section>
            <div class="text-subtitle2">
              {{ tdc('Login successfully') }}
              <br>
              {{ tdc('Redirect to home page') }}...
            </div>
          </q-card-section>
        </s-card>

        <q-form class="q-mt-md" @submit.prevent="login">
          <s-input
            v-model="identifier"
            outlined
            clearable
            :readonly="User.loading"
            :label="tdc('Username or Phone or Email')"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>

            <template #append>
              <q-icon name="phone" />
            </template>
          </s-input>

          <s-input
            v-model="password"
            outlined
            clearable
            :readonly="User.loading"
            :type="isPwd ? 'password' : 'text'"
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

          <s-checkbox
            v-model="User.manterLogado"
            dense
            class="text-grey-7"
            :label="tdc('Keep me logged in')"
            @update:model-value="check"
          />

          <s-btn
            type="submit"
            size="md"
            color="positive"
            dense
            class="full-width q-mt-md"
            :readonly="User.loading"
            :disable="User.loading"
            :loading="User.loading"
            :label="tdc('Login')"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="around">
        <s-btn
          flat
          size="md"
          color="purple"
          :to="{ name: 'esquecerpassword' }"
          :label="tdc('Forgot my password')"
        />

        <s-btn
          flat
          size="md"
          color="primary"
          :to="{ name: 'registarUser' }"
          :label="tdc('Register')"
        />
      </q-card-actions>
    </s-card>
  

    <!-- First login with a TEMPORARY password: choose a definitive one. No
         session exists until this succeeds. -->
    <q-dialog v-model="changeDialog" persistent>
      <s-card class="change-card">
        <q-card-section>
          <div class="text-h6">{{ tdc('Choose your password') }}</div>
          <div class="text-caption text-grey-7">
            {{ tdc('Your temporary password must be replaced before you can continue.') }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="changePassword">
            <s-input
              v-model="newPassword"
              outlined
              type="password"
              autocomplete="new-password"
              :label="tdc('New password')"
              :rules="[v => (v && v.length >= 8) || tdc('The password must be at least 8 characters long')]"
              data-test="new-password"
            />
            <s-input
              v-model="confirmPassword"
              outlined
              type="password"
              autocomplete="new-password"
              :label="tdc('Confirm password')"
              :rules="[v => v === newPassword || tdc('The passwords do not match')]"
              data-test="confirm-password"
            />

            <div class="row justify-end q-gutter-sm">
              <s-btn flat :label="tdc('Cancel')" :disable="User.loading" data-test="change-cancel" @click="cancelChange" />
              <s-btn
                type="submit"
                unelevated
                color="primary"
                :label="tdc('Save password')"
                :loading="User.loading"
                data-test="change-submit"
              />
            </div>
          </q-form>
        </q-card-section>
      </s-card>
    </q-dialog>

    <!-- Two-factor is active on the account: the password alone gets no
         session, a code from the authenticator app (or a recovery code) does. -->
    <q-dialog :model-value="User.loginMsg === 'two_factor'" persistent>
      <s-card class="change-card">
        <q-card-section>
          <div class="text-h6">{{ tdc('Two-factor authentication') }}</div>
          <div class="text-caption text-grey-7">
            {{ tdc('Enter the 6-digit code from your authenticator app, or a recovery code.') }}
          </div>
        </q-card-section>

        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="submitTwoFactor">
            <s-input
              v-model="twoFactorCode"
              outlined
              autofocus
              autocomplete="one-time-code"
              :label="tdc('Authentication code or recovery code')"
              data-test="two-factor-code"
            />

            <div class="row justify-end q-gutter-sm">
              <s-btn flat :label="tdc('Cancel')" :disable="User.loading" data-test="two-factor-cancel" @click="cancelTwoFactor" />
              <s-btn
                type="submit"
                unelevated
                color="primary"
                :label="tdc('Verify')"
                :loading="User.loading"
                :disable="twoFactorCode.trim().length < 6"
                data-test="two-factor-submit"
              />
            </div>
          </q-form>
        </q-card-section>
      </s-card>
    </q-dialog>

    <!-- The organisation REQUIRES two-factor and this account has none yet:
         enrol before the first session (no way to close it but cancelling). -->
    <TwoFactorSetupDialog
      :model-value="User.loginMsg === 'two_factor_setup'"
      persistent
      :begin="beginTwoFactorSetup"
      :confirm="confirmTwoFactorSetup"
      @update:model-value="value => !value && cancelTwoFactor()"
      @finished="finishTwoFactorSetup"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AllLogo from './../components/AllLogo.vue'
import TwoFactorSetupDialog from './user/TwoFactorSetupDialog.vue'
import { loadUserSaas } from './../boot/login_boot'
import { tdc } from '../services/translation'
import { Alert } from '../boot/alerts'
import { getStorage, setStorage } from '../services/storage'
import { useUserStore } from '../stores/UserStore'
import { useEntityStore } from '../stores/EntityStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'

export default defineComponent({
  name: 'FormLogin',

  components: {
    AllLogo,
    TwoFactorSetupDialog
  },

  setup () {
    return {
      Entity: useEntityStore(),
      EntityType: useEntityTypeStore(),
      User: useUserStore(),
      q: useQuasar(),
      router: useRouter(),
      tdc
    }
  },

  data () {
    return {
      user_id: null,
      entity_id: null,
      isPwd: true,
      readonly: false,
      identifier: '',
      password: '',
      incorrectEntityType: false,
      correctEntityType: false,
      latitude: '',
      longitude: '',
      local: '',
      ipAddress: '0.0.0.0',
      changeDialog: false,
      newPassword: '',
      confirmPassword: '',
      // local only - never Pinia/storage
      twoFactorCode: '',
      pendingSession: null
    }
  },

  computed: {
    currentEntity () {
      return this.Entity?.row || null
    },

    currentEntityType () {
      if (this.EntityType?.row) {
        return this.EntityType.row
      }

      if (
        this.currentEntity?.entity_type &&
        typeof this.currentEntity.entity_type === 'object'
      ) {
        return this.currentEntity.entity_type
      }

      return null
    },

    showLoginLogo () {
      const entityValue = this.currentEntity?.display_logo_login

      if (entityValue !== null && entityValue !== undefined) {
        return Boolean(entityValue)
      }

      const entityTypeValue =
        this.currentEntityType?.display_logo_login

      if (entityTypeValue !== null && entityTypeValue !== undefined) {
        return Boolean(entityTypeValue)
      }

      return true
    }
  },

  watch: {
    'User.redirect' (value) {
      if (!value) return

      this.router.push({ name: value })
      this.User.redirect = ''
    },

    async 'User.isLogin' (value) {
      if (value) {
        await loadUserSaas(this.q)
      }
    }
  },

  mounted () {
    this.User.manterLogado =
      getStorage('l', 'manterlogado') === 'true'
  },

  methods: {
    check () {
      setStorage(
        'l',
        'manterlogado',
        this.User.manterLogado
      )
    },

    getGeolocation () {
      if (!navigator.geolocation) {
        this.errorPosition()
        return
      }

      navigator.geolocation.getCurrentPosition(
        this.setPosition,
        this.errorPosition
      )
    },

    setPosition (position) {
      this.latitude = position.coords.latitude
      this.longitude = position.coords.longitude
    },

    errorPosition () {
      this.q.notify({
        position: 'bottom',
        timeout: 3000,
        color: 'negative',
        textColor: 'white',
        actions: [
          {
            icon: 'close',
            color: 'white'
          }
        ],
        message: tdc('Could not retrieve your location!')
      })
    },

    async login () {
      document.activeElement?.blur()

      setStorage(
        'l',
        'manterlogado',
        this.User.manterLogado
      )

      this.correctEntityType = false
      this.incorrectEntityType = false

      try {
        await this.User.login(
          {
            identifier: this.identifier,
            password: this.password
          },
          this.q
        )

        // temporary password: no session yet - ask for the definitive one
        if (this.User.loginMsg === 'must_change') {
          this.newPassword = ''
          this.confirmPassword = ''
          this.changeDialog = true
          return
        }

        // the typed password is not needed any more
        this.password = ''

        // two-factor pending: the dialogs above take over, no session yet
        if (['two_factor', 'two_factor_setup'].includes(this.User.loginMsg)) return

        this.correctEntityType = true
      } catch (error) {
        this.incorrectEntityType = true
      }
    },

    async submitTwoFactor () {
      const code = this.twoFactorCode.trim()
      if (code.length < 6) return

      try {
        await this.User.verifyTwoFactorLogin(code)
        this.twoFactorCode = ''
        this.correctEntityType = true
      } catch {
        // the API client alerted the reason; a wrong code keeps the step open
        this.twoFactorCode = ''
      }
    },

    beginTwoFactorSetup () {
      return this.User.setupTwoFactorLogin()
    },

    async confirmTwoFactorSetup (code) {
      const { recovery_codes: codes, session } = await this.User.confirmTwoFactorLogin(code)

      // the session starts only after the user has seen the recovery codes
      this.pendingSession = session
      return codes
    },

    async finishTwoFactorSetup () {
      const session = this.pendingSession
      this.pendingSession = null

      if (!session) return

      await this.User.startSession(session)
      this.correctEntityType = true
    },

    cancelTwoFactor () {
      this.twoFactorCode = ''
      this.pendingSession = null
      this.password = ''
      this.User.cancelTwoFactorStep()
    },

    cancelChange () {
      this.changeDialog = false
      this.newPassword = ''
      this.confirmPassword = ''
      this.password = ''
      this.User.loginMsg = ''
    },

    async changePassword () {
      if (this.newPassword.length < 8 || this.newPassword !== this.confirmPassword) return

      try {
        await this.User.changeTemporaryPassword({
          identifier: this.identifier,
          password: this.password,
          newPassword: this.newPassword
        })

        this.changeDialog = false
        this.newPassword = ''
        this.confirmPassword = ''
        this.password = ''

        if (['two_factor', 'two_factor_setup'].includes(this.User.loginMsg)) return

        this.correctEntityType = true
      } catch (error) {
        Alert(error?.response)
      }
    }
  }
})
</script>

<style scoped>
.change-card { width: 420px; max-width: 94vw; }

.login-card {
  width: 100%;
  max-width: 300px;
}
</style>