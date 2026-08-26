<template>
  <div class="row items-center justify-evenly bg-transparent">
    <s-card flat class="text-center bg-transparent login-card">
      <AllLogo />

      <q-card-section class="text-left">
        <s-card
          v-if="User.loginMsg === 'error'"
          class="bg-red text-white"
        >
          <q-card-section>
            <div class="text-subtitle2">
              {{ tdc('Incorrect username or password entered') }}
              <br>
              {{ tdc('please try again') }}
            </div>
          </q-card-section>
        </s-card>

        <s-card
          v-if="User.loginMsg === 'good'"
          class="bg-green text-white"
        >
          <q-card-section>
            <div class="text-subtitle2">
              {{ tdc('Login successfuly') }}
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
            label="Username or Phone or Email"
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
            label="Password"
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
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import AllLogo from './../components/AllLogo.vue'
import { loadUserSaas } from './../boot/login_boot'
import { tdc } from '../services/translation'
import { getStorage, setStorage } from '../services/storage'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'

export default defineComponent({
  name: 'FormLogin',

  components: {
    AllLogo
  },

  setup () {
    return {
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
      ipAddress: '0.0.0.0'
    }
  },

  watch: {
    'User.redirect' (value) {
      if (!value) return

      this.router.push({ name: value })
      this.User.redirect = ''
    },

    async 'User.isLogin' (value) {
      if (value) await loadUserSaas(this.q)
    }
  },

  mounted () {
    this.User.manterLogado =
      getStorage('l', 'manterlogado') === 'true'
  },

  methods: {
    check () {
      setStorage('l', 'manterlogado', this.User.manterLogado)
    },

    getGeolocation () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          this.setPosition,
          this.errorPosition
        )
      } else {
        this.errorPosition()
      }
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
        actions: [{ icon: 'close', color: 'white' }],
        message: 'Could not retrieve your location!'
      })
    },

    async login () {
      document.activeElement?.blur()

      setStorage('l', 'manterlogado', this.User.manterLogado)

      this.correctEntityType = false
      this.incorrectEntityType = false

      try {
        await this.User.login({
          identifier: this.identifier,
          password: this.password
        }, this.q)

        this.correctEntityType = true
      } catch (error) {
        this.incorrectEntityType = true
      }
    }
  }
})
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 300px;
}
</style>