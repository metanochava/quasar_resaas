<template>
  <q-page class="row items-center justify-evenly bg-transparent">
    <s-card flat square class="text-center bg-transparent forgot-card">
      <q-card-section class="text-left">
        <div class="text-h6 q-mb-md">{{ tdc('Forgot my password') }}</div>

        <div v-if="sent" class="text-body2 q-mb-md">
          {{ tdc('If that email is registered, we sent a link to reset your password') }}
        </div>

        <q-form v-else @submit.prevent="requestReset">
          <s-input
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

          <s-btn
            type="submit"
            size="md"
            color="positive"
            dense
            class="full-width q-mt-md"
            :disable="!email || loading"
            :loading="loading"
            :label="tdc('Send reset link')"
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

export default defineComponent({
  name: 'ForgotPasswordPage',

  setup() {
    return { tdc }
  },

  data() {
    return {
      email: '',
      loading: false,
      sent: false
    }
  },

  methods: {
    async requestReset() {
      if (!this.email) return

      this.loading = true

      try {
        await HTTPClient.post(
          url({ type: 'u', url: 'password/reset/email/' }),
          { email: this.email, redirect_url: '' }
        )

        this.sent = true
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
.forgot-card {
  width: 100%;
  max-width: 340px;
}
</style>
