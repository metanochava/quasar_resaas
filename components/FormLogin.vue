
<template>
  <q-page class=" row items-center justify-evenly" >
      <q-card square  flat class="text-center" style="max-width: 300px">
        <AllLogo />
        <q-card-section class="text-left justify-evenly">
          <q-card  v-if="User.loginMsg == 'error'" class="my-card bg-red text-white">
            <q-card-section>
              <div class="text-subtitle2">{{ tdc('Incorrect username or password entered') }} <br> {{ tdc('please try again') }}</div>
            </q-card-section>

          </q-card>
          <q-card  v-if="User.loginMsg == 'good'" class="my-card bg-green text-white">
            <q-card-section>
              <div class="text-subtitle2"> {{ tdc('Login successfuly') }} <br>
                {{ tdc('Redirect to home page') }}...</div>
            </q-card-section>

          </q-card>
          <br>
          <q-form  @submit.prevent="login">

            <q-input outlined dense @keyup.enter="login()" clearable v-model="identifier" :label="tdc('Usuario ou Celular ou Email')">
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
              <template v-slot:append>
                <q-icon name="phone" />
              </template>
            </q-input>
            <br/>
            <q-input outlined dense @keyup.enter="login()"  :readonly="readonly" clearable v-model="password" :type="isPwd ? 'password': 'text'" :label="tdc('Senha')">

              <template v-slot:prepend>
                <q-icon
                  name="lock"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <br/>
            <q-checkbox  class="text-grey-7" dense   clearable v-model="User.manterLogado"  @click="check" :label="tdc('Manter-me logado')">
            </q-checkbox>
          </q-form>
        </q-card-section>

        <q-card-actions class="q-px-md" >
          <q-btn  :readonly="User.loading" :disable="User.loading"
                  :loading="User.loading" size="md" @click="login()"  
                  color="positive" dense class="full-width " 
                  :label="tdc('Entrar')"
          />
          <p></p>
        </q-card-actions>
        <q-card-actions align="around" >
          <q-btn flat :to="{name:'esquecerpassword'}"  size="md"  color="purple" :label="tdc('Esqueci minha') + ' ' + tdc('Senha')" />
          <q-btn flat :to="{name:'registarUser'}"  size="md" color="primary" class="" :label="tdc('Registar')" />
        </q-card-actions>
      </q-card>
  </q-page>
</template>
<style scoped>

</style>
<script >

import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { TipoEntidadeStore, UserStore } from '../stores/TipoEntidadeStore'
import { setStorage, getStorage } from '../boot/storage'
import AllLogo  from './../components/AllLogo.vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'


export default defineComponent({
  name: 'FormLogin',

  props: {

  },

  components: {
    AllLogo
  },
  setup () {
    const Auth = TipoEntidadeStore()
    const  User = UserStore()
    const q = useQuasar()
    const router = useRouter()
    return {
      Auth,
      tdc,
      User,
      q,
      router
    }
  },
  data () {
    return {
      user_id: null,
      entidade_id: null,
      isPwd: true,
      readonly: false,
      identifier: '',
      password: '',
      incorrectAuth: false,
      correctAuth: false,
      latitude: '',
      longitude: '',
      local: '',
      ipAddress: '0.0.0.0'
    }
  },
  computed: {

  },
  watch: {
    'User.redirect'(val) {
      console.log(val)
      if (val) {
        this.router.push({ name: val })   // ✅ agora funciona
        this.User.redirect = '' // reset
      }
    }
  },
  mounted () {

   if (getStorage('c', 'manterlogado') === 'true') {
      this.User.manterLogado = true
    } else {
      this.User.manterLogado = false
    }
    this.getGeolocation()
  },
  methods: {
    check () {
      setStorage('c', 'manterlogado', this.User.manterLogado, 365)
    },
    getGeolocation () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.setPosition, this.errorPosition)
      } else {
        this.errorPosition()
      }
    },
    setPosition (position) {
      const coords = position.coords
      this.latitude = coords.latitude
      this.longitude = coords.longitude
    },
    errorPosition () {
      this.q.notify({
        position: 'bottom',
        timeout: 3000,
        color: 'negative',
        textColor: 'white',
        actions: [{ icon: 'close', color: 'white' }],
        message: 'Não foi possível recupera sua posição!'
      })
    },

    async login () {

      setStorage('c', 'manterlogado', this.User.manterLogado, 365)

      this.correctAuth = false

      await this.User.login({
        identifier: this.identifier,
        password: this.password,
      }, this.q).then(res => {
        this.correctAuth = true
      }).catch(err => {
        this.incorrectAuth = true
      })
    }
  }
})
</script>
