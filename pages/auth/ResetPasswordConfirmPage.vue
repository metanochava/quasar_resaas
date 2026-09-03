<template>
  <q-page class="row items-center justify-evenly bg-transparent">
    <s-card flat square class="text-center bg-transparent reset-card">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">{{ tdc('Reset password') }}</div>

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

          <s-btn
            type="submit"
            size="md"
            color="positive"
            dense
            class="full-width q-mt-md"
            :disable="!canSubmit"
            :loading="loading"
            :label="tdc('Reset password')"
          />
        </q-form>
      </q-card-section>
    </s-card>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

import { HTTPClient, url } from '../../services/api'
import { tdc } from '../../services/translation'

export default defineComponent({
  name: 'ResetPasswordConfirmPage',

  setup() {
    return { tdc }
  },

  data() {
    return {
      password: '',
      confirmPassword: '',
      loading: false,
      failed: false
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
        this.failed = true
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<style scoped>
.reset-card {
  width: 100%;
  max-width: 340px;
}
</style>
