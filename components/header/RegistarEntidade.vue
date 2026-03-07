
<template>
  <div>
    <q-dialog v-model="pergunta" persistent class="row">
        <q-card style="width: 400px;" flat>

          <q-card-section class="row ">
            <label class="text-h6 text-grey-9 text-center">
              {{tdc('De qual deseja sair')}}
            </label>
          </q-card-section>
          <q-separator />

          <q-card-actions class="row" >
            <q-btn flat   class="col-12" color="primary" type="submit" @click="logout(User?.Entidade?.id)" > {{tdc(User?.Entidade?.nome)}}</q-btn>
          </q-card-actions>

          <q-card-actions class="row" >
            <q-btn flat   class="col-12" color="primary" type="submit" @click="logout('x')" > {{tdc(User?.TipoEntidade?.nome)}}</q-btn>
          </q-card-actions>
          <q-separator/>
          <q-card-actions class="row" >
            <q-btn  class="col-12" flat v-close-popup>{{tdc('Cancelar')}}</q-btn>
          </q-card-actions>
        </q-card>

    </q-dialog>

    <q-btn round flat>
      <q-avatar class="" size="45px" :class="$q.dark.isActive ? 'bg-white' : 'bg-white'" >
        <img  v-if="UserPessoa" :src="User?.perfil?.url" >
        <img  v-else src="https://awsacademy.instructure.com/images/messages/avatar-50.png" >
        <q-card-actions align="center" v-if="User" flat>
          <div class="text-h6 text-gry-8 row text-center">{{User?.username}}</div>
        </q-card-actions>
        <q-separator />
        <q-menu flat  square  fit :offset="[130, 5]"  >
          <q-card class="my-card"  style="width:270px;"  flat bordered square  >
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

            <q-btn dense  flat  size="" @click="sucursalClosed = false" color="grey" :label="tdc(perfilSplint(User?.Grupo?.name)) " style="width: 100%; border-color: transparent;">
              <q-menu fit>
                <q-list dense   class="rounded-borders" style="min-width: 100px" >
                  <q-item clickable v-close-popup v-if="'domain'=='domain'" @click="selectGroup({id:'1', name:'Hóspede'})"  >
                    <q-item-section>
                      <q-item-label overline> {{tdc('Hóspede')}}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-else @click="selectGroup({id:'1', name:'Hóspede'})"  >
                    <q-item-section>
                      <q-item-label overline> {{tdc('Hóspede')}}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click="selectGroup(grupo)" v-ripple v-for=" grupo in User.Grupos" :key="grupo.id">
                    <q-item-section>
                      <q-item-label overline> {{ tdc(perfilSplint(grupo.name))}}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>

            <q-btn v-show="User" style="width: 100%; border-color: transparent;"  icon="settings" dense size=""  :to="{name:'userDetails', params:{'user_id': User?.id}}" flat color="secondary" class="">{{tdc('Definições')}}</q-btn>
            <q-btn v-show="User" style="width: 100%; border-color: transparent;"  icon="logout" dense size="" flat color="red" @click="modal_pergunta">{{tdc('Sair')}}</q-btn>

            <q-btn v-show="!User"  style="width: 100%; border-color: transparent;" dense size="" :to="{name:'registarUser'}" flat color="primary" class="" :label="tdc('Registar')" />
            <q-btn v-show="!User"  style="width: 100%; border-color: transparent;" dense size="" :to="{name:'login'}" flat color="secondary" class="" >{{tdc('login')}}</q-btn>

            <q-separator color="primary" dense size="xs" />
          </q-card>

        </q-menu>
      </q-avatar>
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-if="User">{{User?.username }} </q-tooltip>
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-else>{{tdc('Hóspede')}}</q-tooltip>
    </q-btn>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { HTTPAuth, url } from '../../boot/api'
import { tdc } from '../../boot/base'
import { deleteStorage, getStorage, setStorage } from '../../boot/storage'
import { UserStore } from '../../stores/TipoEntidadeStore'

export default defineComponent({
  name: 'RegistarEntidade',
  components: {

  },

  setup () {
    const User = UserStore()
    return { User }
  },

  data () {
    return {
      tdc: tdc,
      sucursalClosed: true,
      pergunta: false,
      selectSucursalModal: false,
    }
  },

  methods: {

    perfilSplint (datax) {
      try {
        const vare = datax.split('_')
        if (vare[1] != null) {
          return vare[1]
        } else {
          return vare[0]
        }
      } catch (err) {
        return null
      }
    },

    /* --------------------- SELECT ENTIDADE --------------------- */
    selectEntidade (entidade) {
      setStorage('c', 'userEntidade', JSON.stringify(entidade), 365)

      if (this.User) this.User.Entidade = JSON.parse(getStorage('c', 'userEntidade'))

      this.selectSucursalModal = false
      this.getUserSucursals()
      this.getEntidadeModulos()
      this.sucursalClosed = true
    },

    /* --------------------- SELECT SUCURSAL --------------------- */
    selectSucursal (sucursal) {
      setStorage('c', 'userSucursal', JSON.stringify(sucursal), 365)

      if (this.User) this.User.Sucursal = JSON.parse(getStorage('c', 'userSucursal'))

      this.selectSucursalModal = false
      this.getUserPerfils()
      this.sucursalClosed = false
    },

    /* --------------------- GET USER SUCURSALS --------------------- */
    async getUserSucursals () {
      this.spiner = true

      if (getStorage('c', 'userEntidade') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/usuarios/' + this.User?.id + '/userSucursals/', params: {} }))
            .then(res => {
              setStorage('c', 'userSucursals', JSON.stringify(res.data), 365)

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
            setStorage('c', 'userPerfils', JSON.stringify(res.data), 365)

            if (this.User) this.User.Grupos = res.data
          })
          .catch(err => console.log(err))
      } catch (error) {
        console.log(error.message)
      }
    },

    /* --------------------- SELECT GROUP --------------------- */
    async selectGroup (group) {
      setStorage('c', 'userGrupo', JSON.stringify(group), 365)

      if (this.User) this.User.Grupo = group

      await this.getUserPermicoes()
      this.$router.push({ name: 'home', params: {} })
    },

    /* --------------------- GET USER PERMISSOES --------------------- */
    async getUserPermicoes () {
      if (getStorage('c', 'userSucursal') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/usuarios/' + this.User?.data?.id + '/userPermicoes/', params: {} }))
            .then(res => {
              if (this.User) {
                this.User.Permicoes = new Set(res.data)
                setStorage('l', 'userPermicoes', JSON.stringify(this.User.Permicoes), 365)
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
      if (getStorage('c', 'userEntidade') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/entidades/' + this.User?.Entidade.id + '/modulos/', params: {} }))
            .then(res => {
              setStorage('c', 'entidadeModulos', JSON.stringify(res.data), 365)

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
    const storedUser = getStorage('c', 'user')

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
      const ent = getStorage('c', 'userEntidade')
      const suc = getStorage('c', 'userSucursal')
      const gru = getStorage('c', 'userGrupo')

      try {
        this.User.Entidade = ent ? JSON.parse(ent) : null
        this.User.Sucursal = suc ? JSON.parse(suc) : null
        this.User.Grupo = gru ? JSON.parse(gru) : null
      } catch (err) {
        console.error('Erro ao parsear entidades/grupo:', err)
      }

      if (!this.User?.Grupo?.id) {
        // this.getEntidades()
      }
    }
  }
})
</script>

