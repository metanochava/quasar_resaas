
<template>
  <div>
    <q-dialog v-model="pergunta" persistent class="row">
        <s-card style="width: 400px;" flat>

          <q-card-section class="row ">
            <label class="text-h6 text-grey-9 text-center">
              {{tdc('De qual deseja sair')}}
            </label>
          </q-card-section>
          <q-separator />

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary" type="submit" @click="logout(User?.Entidade?.id)" > {{tdc(User?.Entidade?.nome)}}</s-btn>
          </q-card-actions>

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary" type="submit" @click="logout('x')" > {{tdc(User?.TipoEntidade?.nome)}}</s-btn>
          </q-card-actions>
          <q-separator/>
          <q-card-actions class="row" >
            <s-btn  class="col-12" flat v-close-popup>{{tdc('Cancelar')}}</s-btn>
          </q-card-actions>
        </s-card>

    </q-dialog>

    <s-btn round flat>
      <q-avatar class="" size="45px" :class="$q.dark.isActive ? 'bg-white' : 'bg-white'" >
        <img  v-if="UserPessoa" :src="User?.perfil?.url" >
        <img  v-else src="https://awsacademy.instructure.com/images/messages/avatar-50.png" >
        <q-card-actions align="center" v-if="User" flat>
          <div class="text-h6 text-gry-8 row text-center">{{User?.username}}</div>
        </q-card-actions>
        <q-separator />
        <q-menu flat  square  fit :offset="[130, 5]"  >
          <s-card class="my-card"  style="width:270px;"  flat bordered square  >
            <q-card-actions class="text-center row" v-if="User">
              <div class=" col-12">
                <q-avatar class="" size="120px"  >
                  <img  v-if="User" :src="User?.perfil?.url" >
                  <img  v-else src="https://awsacademy.instructure.com/images/messages/avatar-50.png" >
                </q-avatar>
              </div>
              <div class=" text-center col-12 text-grey-9 text-h6">
                {{User?.username}}
              </div>
            </q-card-actions>
            <q-separator  v-if="User" />
            <q-expansion-item
                v-if="User"
                dense
                group="group"
                :label="tdc('Entidade') "
                header-class=" text-grey-9"
                :caption="UserEntidade?.nome"
              >
                <q-separator />
                <q-item dense clickable v-if="User?.TipoEntidade?.crair_entidade"   :to="{name:'add_entidade_self', params:{}}"  >
                  <q-item-section>
                    <center><q-item-label overline class="text-blue"> {{ tdc('Registar Entidade')}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
                <q-item dense clickable v-for="entidade in User?.Entidades" :key="entidade?.id" @click="selectEntidade(entidade)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc((entidade?.nome))}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

              <q-expansion-item
                v-if="User?.Entidade"
                dense
                group="group"
                :label="tdc('Sucursal') "
                header-class=" text-grey-9"
                :caption="User?.Sucursal?.nome"
                default-opened
                v-model="sucursalClosed"
              >
                <q-separator />
                <q-item dense clickable v-for="sucursal in User?.Sucursals" :key="sucursal?.id"   @click="selectSucursal(sucursal)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc(sucursal?.nome)}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

            <s-btn dense  flat  size="" @click="sucursalClosed = false" color="grey" :label="tdc(perfilSplint(User?.Group?.name)) " style="width: 100%; border-color: transparent;">
              <q-menu fit>
                <q-list dense   class="rounded-borders" style="min-width: 100px" >
                  <q-item clickable v-close-popup @click="selectGroup(group)" v-ripple v-for=" group in User.Groups" :key="group.id">
                    <q-item-section>
                      <q-item-label overline> {{ tdc(perfilSplint(group.name))}}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </s-btn>

            <s-btn v-show="User" style="width: 100%; border-color: transparent;"  icon="settings" dense size=""  :to="{name:'userDetails', params:{'user_id': User?.id}}" flat color="secondary" class="">{{tdc('Definições')}}</s-btn>
            <s-btn v-show="User" style="width: 100%; border-color: transparent;"  icon="logout" dense size="" flat color="red" @click="modal_pergunta">{{tdc('Sair')}}</s-btn>

            <s-btn v-show="!User"  style="width: 100%; border-color: transparent;" dense size="" :to="{name:'registarUser'}" flat color="primary" class="" :label="tdc('Registar')" />
            <s-btn v-show="!User"  style="width: 100%; border-color: transparent;" dense size="" :to="{name:'login'}" flat color="secondary" class="" >{{tdc('login')}}</s-btn>

            <q-separator color="primary" dense size="xs" />
          </s-card>

        </q-menu>
      </q-avatar>
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-if="User">{{User?.username }} </q-tooltip>
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-else>{{tdc(User?.Group?.name)}}</q-tooltip>
    </s-btn>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { HTTPAuth, url } from '../../boot/api'
import { tdc, perfilSplint } from '../../boot/base'
import { deleteStorage, getStorage, setStorage } from '../../boot/storage'
import { useUserStore } from '../../stores/UserStore'

export default defineComponent({
  name: 'RegistarEntidade',
  components: {

  },

  setup () {
    const User = useUserStore()
    return { User }
  },

  data () {
    return {
      tdc: tdc,
      sucursalClosed: true,
      pergunta: false,
      selectSucursalModal: false,
      perfilSplint: perfilSplint,
    }
  },

  methods: {
    /* --------------------- SELECT ENTIDADE --------------------- */
    selectEntidade (entidade) {
      setStorage('l', 'userEntidade', JSON.stringify(entidade))

      if (this.User) this.User.Entidade = JSON.parse(getStorage('l', 'userEntidade'))

      this.selectSucursalModal = false
      this.getUserSucursals()
      this.getEntidadeModulos()
      this.sucursalClosed = true
    },

    /* --------------------- SELECT SUCURSAL --------------------- */
    selectSucursal (sucursal) {
      setStorage('l', 'userSucursal', JSON.stringify(sucursal))

      if (this.User) this.User.Sucursal = JSON.parse(getStorage('l', 'userSucursal'))

      this.selectSucursalModal = false
      this.getUserPerfils()
      this.sucursalClosed = false
    },

    /* --------------------- GET USER SUCURSALS --------------------- */
    async getUserSucursals () {
      this.spiner = true

      if (getStorage('l', 'userEntidade') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/usuarios/' + this.User?.id + '/userSucursals/', params: {} }))
            .then(res => {
              setStorage('l', 'userSucursals', JSON.stringify(res.data))

              if (this.User) this.User.Sucursals = res.data
            })
            .catch(err => console.log(err))
        } catch (error) {
          console.log(error.message)
        }
      }
    },

    /* --------------------- GET USER PERFILS --------------------- */
    async getUserPerfils () {
      try {
        await HTTPAuth.get(url({ type: 'u', url: 'saas/usuarios/' + this.User?.id + '/userPerfils/', params: {} }))
          .then(res => {
            setStorage('l', 'userPerfils', JSON.stringify(res.data))

            if (this.User) this.User.Groups = res.data
          })
          .catch(err => console.log(err))
      } catch (error) {
        console.log(error.message)
      }
    },

    /* --------------------- SELECT GROUP --------------------- */
    async selectGroup (group) {
      setStorage('l', 'userGroup', JSON.stringify(group))

      if (this.User) this.User.Group = group

      await this.getUserPermissions()
      this.$router.push({ name: 'home', params: {} })
    },

    /* --------------------- GET USER PERMISSOES --------------------- */
    async getUserPermissions () {
      if (getStorage('l', 'userSucursal') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/users/' + this.User?.data?.id + '/permissions/', params: {} }))
            .then(res => {
              if (this.User) {
                this.User.Permissions = new Set(res.data)
                setStorage('l', 'userPermissions', JSON.stringify(this.User.Permissions))
              }
            })
            .catch(err => console.log(err))
        } catch (error) {
          console.log(error.message)
        }
      }
    },

    /* --------------------- GET ENTIDADE MODULOS --------------------- */
    async getEntidadeModulos () {
      if (getStorage('l', 'userEntidade') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'api/entidades/' + this.User?.Entidade.id + '/resaas_modulos/', params: {} }))
            .then(res => {
              setStorage('l', 'entidadeModulos', JSON.stringify(res.data))

              if (this.User) this.User.EntidadeModulos = res.data
            })
            .catch(err => console.log(err))
        } catch (error) {
          console.log(error.message)
        }
      }
    }
  },

  mounted () {
    const storedUser = getStorage('l', 'user')

    if (storedUser) {
      try {
        if (this.User) this.User.data = JSON.parse(storedUser)
      } catch (err) {
        console.error('Erro ao fazer JSON.parse(user):', err)
        if (this.User) this.User.data = { id: '1', username: 'Gest' }
      }
    } else {
      if (this.User) this.User.data = { id: '1', username: 'Gest' }
    }

    if (this.User) {
      const ent = getStorage('l', 'userEntidade')
      const suc = getStorage('l', 'userSucursal')
      const gru = getStorage('l', 'userGroup')

      try {
        this.User.Entidade = ent ? JSON.parse(ent) : null
        this.User.Sucursal = suc ? JSON.parse(suc) : null
        this.User.Group = gru ? JSON.parse(gru) : null
      } catch (err) {
        console.error('Erro ao parsear entidades/group:', err)
      }

      if (!this.User?.Group?.id) {
        // this.getEntidades()
      }
    }
  }
})
</script>

