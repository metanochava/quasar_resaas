<template>
  <q-page class="row items-center justify-evenly">
    <div class="q-gutter-y-sm text-center reset-wrap">
      <AllLogo v-if="showLoginLogo" />

      <s-card flat square class="text-center bg-transparent reset-card">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md text-center">{{ tdc('Reset password') }}</div>

        <div v-if="failed" class="text-body2 q-mb-md">
          {{ tdc('The reset link is invalid or has expired') }}
          <div class="q-mt-sm">
            <s-btn
              flat
              size="sm"
              color="primary"
              :to="{ name: 'esquecerpassword' }"
              :label="tdc('Request a new link')"
            />
          </div>
        </div>

        <q-form v-else @submit.prevent="submit">
          <s-input
            v-model="password"
            outlined
            clearable
            type="password"
            :readonly="loading"
            :label="tdc('New password')"
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
            :label="tdc('Confirm new password')"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </s-input>

          <div v-if="passwordMismatch" class="text-caption text-negative q-mb-sm">
            {{ tdc('Passwords do not match') }}
          </div>

          <div v-if="passwordError" class="text-caption text-negative q-mb-sm" data-test="reset-password-error">
            {{ passwordError }}
          </div>

          <s-btn
            type="submit"
            size="md"
            color="primary"
            dense
            class="full-width q-mt-md"
            :disable="!canSubmit"
            :loading="loading"
            :label="tdc('Reset password')"
          />
        </q-form>
      </q-card-section>
      </s-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

import { HTTPClient, url } from '../../services/api'
import { tdc } from '../../services/translation'
import { parseFieldErrors } from '../../utils/apiContract'

import AllLogo from '../../components/AllLogo.vue'
import { useShowLoginLogo } from '../../composables/useShowLoginLogo'

export default defineComponent({
  name: 'ResetPasswordConfirmPage',

  components: {
    AllLogo
  },

  setup() {
    const { showLoginLogo } = useShowLoginLogo()

    return { tdc, showLoginLogo }
  },

  data() {
    return {
      password: '',
      confirmPassword: '',
      loading: false,
      failed: false,
      passwordError: ''
    }
  },

  computed: {
    passwordMismatch() {
      return !!this.confirmPassword && this.password !== this.confirmPassword
    },

    canSubmit() {
      return !!(
        this.password &&
        this.password.length >= 8 &&
        this.password === this.confirmPassword &&
        !this.loading
      )
    }
  },

  methods: {
    async submit() {
      if (!this.canSubmit) return

      this.loading = true
      this.passwordError = ''

      try {
        await HTTPClient.patch(
          url({ type: 'u', url: 'password/reset/complete/' }),
          {
            password: this.password,
            uidb64: this.$route.params.uidb64,
            token: this.$route.params.token
          }
        )

        this.$router.push({ name: 'login' })
      } catch (e) {
        // the password policy refused the password: say it at the field;
        // anything else means the link itself is invalid or expired
        const fields = parseFieldErrors(e?.response?.data)
        if (fields.password) {
          this.passwordError = fields.password
        } else {
          this.failed = true
        }
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.reset-wrap {
  width: 100%;
  max-width: 360px;
}

.reset-card {
  width: 100%;
  border-radius: 20px !important;
  /* a light glass card over the layout's translucent theme wash */
  background: rgba(255, 255, 255, 0.62) !important;
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 24px 60px -32px color-mix(in srgb, var(--q-primary) 55%, transparent);
}
.body--dark .reset-card {
  background: rgba(22, 27, 45, 0.55) !important;
  border-color: rgba(255, 255, 255, 0.08);
}
</style>
