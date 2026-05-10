
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
            <s-btn flat   class="col-12" color="primary" type="submit" @click="logout(User?.Entity?.id)" > {{tdc(User?.Entity?.nome)}}</s-btn>
          </q-card-actions>

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary" type="submit" @click="logout('x')" > {{tdc(User?.EntityType?.nome)}}</s-btn>
          </q-card-actions>
          <q-separator/>
          <q-card-actions class="row" >
            <s-btn  class="col-12" flat v-close-popup>{{tdc('Cancelar')}}</s-btn>
          </q-card-actions>
        </s-card>

    </q-dialog>

    <s-btn round flat>
      <q-avatar class="" size="45px" :class="$q.dark.isActive ? 'bg-white' : 'bg-white'" >
        <img  v-if="UserPerson" :src="User?.perfil?.url" >
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
                :label="tdc('Entity') "
                header-class=" text-grey-9"
                :caption="UserEntity?.nome"
              >
                <q-separator />
                <q-item dense clickable v-if="User?.EntityType?.crair_entity"   :to="{name:'add_entity_self', params:{}}"  >
                  <q-item-section>
                    <center><q-item-label overline class="text-blue"> {{ tdc('Registar Entity')}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
                <q-item dense clickable v-for="entity in User?.Entitys" :key="entity?.id" @click="selectEntity(entity)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc((entity?.nome))}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

              <q-expansion-item
                v-if="User?.Entity"
                dense
                group="group"
                :label="tdc('Branch') "
                header-class=" text-grey-9"
                :caption="User?.Branch?.nome"
                default-opened
                v-model="branchClosed"
              >
                <q-separator />
                <q-item dense clickable v-for="branch in User?.Branchs" :key="branch?.id"   @click="selectBranch(branch)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc(branch?.nome)}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

            <s-btn dense  flat  size="" @click="branchClosed = false" color="grey" :label="tdc(perfilSplint(User?.Group?.name)) " style="width: 100%; border-color: transparent;">
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
  name: 'RegisterEntity',
  components: {

  },

  setup () {
    const User = useUserStore()
    return { User }
  },

  data () {
    return {
      tdc: tdc,
      branchClosed: true,
      pergunta: false,
      selectBranchModal: false,
      perfilSplint: perfilSplint,
    }
  },

  methods: {
    /* --------------------- SELECT ENTIDADE --------------------- */
    selectEntity (entity) {
      setStorage('l', 'userEntity', JSON.stringify(entity))

      if (this.User) this.User.Entity = JSON.parse(getStorage('l', 'userEntity'))

      this.selectBranchModal = false
      this.getUserBranchs()
      this.getEntityApps()
      this.branchClosed = true
    },

    /* --------------------- SELECT SUCURSAL --------------------- */
    selectBranch (branch) {
      setStorage('l', 'userBranch', JSON.stringify(branch))

      if (this.User) this.User.Branch = JSON.parse(getStorage('l', 'userBranch'))

      this.selectBranchModal = false
      this.getUserPerfils()
      this.branchClosed = false
    },

    /* --------------------- GET USER SUCURSALS --------------------- */
    async getUserBranchs () {
      this.spiner = true

      if (getStorage('l', 'userEntity') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'saas/usuarios/' + this.User?.id + '/userBranchs/', params: {} }))
            .then(res => {
              setStorage('l', 'userBranchs', JSON.stringify(res.data))

              if (this.User) this.User.Branchs = res.data
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
      if (getStorage('l', 'userBranch') !== null) {
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
    async getEntityApps () {
      if (getStorage('l', 'userEntity') !== null) {
        try {
          await HTTPAuth.get(url({ type: 'u', url: 'api/entitys/' + this.User?.Entity.id + '/resaas_apps/', params: {} }))
            .then(res => {
              setStorage('l', 'entityApps', JSON.stringify(res.data))

              if (this.User) this.User.EntityApps = res.data
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
      const ent = getStorage('l', 'userEntity')
      const suc = getStorage('l', 'userBranch')
      const gru = getStorage('l', 'userGroup')

      try {
        this.User.Entity = ent ? JSON.parse(ent) : null
        this.User.Branch = suc ? JSON.parse(suc) : null
        this.User.Group = gru ? JSON.parse(gru) : null
      } catch (err) {
        console.error('Erro ao parsear entitys/group:', err)
      }

      if (!this.User?.Group?.id) {
        // this.getEntitys()
      }
    }
  }
})
</script>

