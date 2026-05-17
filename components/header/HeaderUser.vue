
<template>
  <div>
    <q-dialog
        v-model="showRegisterEntity"
        persistent
      >
      <RegisterEntity />
    </q-dialog>
    <q-dialog v-model="pergunta" persistent class="row">
        <s-card style="width: 400px;" flat>

          <q-card-section class="row ">
            <label class="text-h6 text-grey-9 text-center">
              {{tdc('De qual deseja sair')}}
            </label>
          </q-card-section>
          <q-separator />

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary"  @click="pergunta = false, User.logout(User.Entity?.id)" > {{tdc(User.Entity?.name)}}</s-btn>
          </q-card-actions>

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary"  @click="pergunta = false, User.logout('x')" > {{tdc(User?.EntityType?.name)}}</s-btn>
          </q-card-actions>
          <q-separator/>
          <q-card-actions class="row" >
            <s-btn  class="col-12" flat v-close-popup>{{tdc('Cancelar')}}</s-btn>
          </q-card-actions>
        </s-card>

    </q-dialog>

    <s-btn round flat>
      <q-avatar class="" size="45px" :class="$q.dark.isActive ? 'bg-white' : 'bg-white'" >
        <img  :src="User?.profile" >
        <q-card-actions align="center" v-if="User" flat>
          <div class="text-h6 text-gry-8 row text-center">{{User?.username}}</div>
        </q-card-actions>
        <q-separator />
        <q-menu flat  square  fit :offset="[130, 5]"  >
          <s-card class="my-card"  style="width:270px;"  flat bordered square  >
            <q-card-actions class="text-center row" v-if="User">
              <div class=" col-12">
                <q-avatar class="" size="120px"  >
                  <img   :src="User?.profile" >
                </q-avatar>
              </div>
              <div class=" text-center col-12 text-grey-9 text-h6">
                {{User?.username}}
              </div>
            </q-card-actions>
            <q-separator  v-if="User" />
            <q-expansion-item
                v-if="User.data"
                dense
                group="group"
                :label="User?.Entity?.name || tdc('Entity') "
                header-class=" text-grey-9"
                v-model="entityClosed"
              >
                <q-separator />
                <q-item dense clickable v-if="User.EntityType?.crair_entity"   :to="{name:'add_entity_self', params:{}}"  >
                  <q-item-section>
                    <q-item-label overline class="text-blue"> {{ tdc('Registar Entity')}}</q-item-label> 
                  </q-item-section>
                </q-item>
                <q-item dense clickable v-for="entity in User?.Entitys" :key="entity?.id" @click=" entityClosed = false, branchClosed = true, Entity.select(entity)">
                  <q-item-section>
                   <q-item-label overline> {{ tdc((entity?.name))}}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

              <q-expansion-item
                v-if="User.data"
                dense
                group="group"
                :label="User?.Branch?.name || tdc('Branch') "
                header-class=" text-grey-9"
                v-model="branchClosed"
              >
                <q-separator />
                <q-item dense clickable v-for="branch in User?.Branchs" :key="branch?.id"   @click=" branchClosed = false, Branch.select(branch)">
                  <q-item-section>
                    <q-item-label overline> {{ tdc(branch?.name)}}</q-item-label> 
                  </q-item-section>
                </q-item>
              </q-expansion-item>

            <s-btn dense  flat  size="" @click="branchClosed = false" color="grey" :label="tdc(profileSplint(User?.Group?.name)) " style="width: 100%; border-color: transparent;">
              <q-menu fit>
                <q-list dense   class="rounded-borders" style="min-width: 100px" >

                  <q-item clickable v-close-popup @click="Group.select(group)" v-ripple v-for=" group in User.Groups" :key="group.id">
                    <q-item-section>
                      <q-item-label overline> {{ tdc(profileSplint(group.name))}}</q-item-label>

                    </q-item-section>

                  </q-item>

                </q-list>
              </q-menu>
            </s-btn>
            <q-card-actions align="around" v-if="User.data">
              <s-btn  icon="settings" dense size=""  :to="{name:'userDetails', params:{'user_id': User?.id}}" flat color="secondary" class="">{{tdc('Definições')}}</s-btn>
              <s-btn  icon="logout" dense size="" flat color="red" @click="pergunta = !pergunta">{{tdc('Sair')}}</s-btn>
            </q-card-actions>

            <q-card-actions align="around" v-else>
              <s-btn  icon="person_add" dense size="" :to="{name:'registarUser'}" flat color="primary" class="" :label="tdc('Registar')" />
              <s-btn  icon="login" dense size="" :to="{name:'login'}" flat color="secondary" class="" >{{tdc('login')}}</s-btn>
            </q-card-actions>
            <q-separator color="primary" dense size="xs" />
          </s-card>

        </q-menu>
      </q-avatar>
      <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary'" v-if="User">{{User?.username }} </q-tooltip>
      <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary'" v-else>{{tdc('Hóspede')}}</q-tooltip>
          
    </s-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { profileSplint, tdc } from '../../boot/base'
import { useUserStore } from '../../stores/UserStore'
import { useGroupStore } from '../../stores/GroupStore'
import { useEntityStore } from '../../stores/EntityStore'
import { useBranchStore } from '../../stores/BranchStore'
import RegisterEntity from './RegisterEntity.vue'


export default defineComponent({
  name: 'HeaderUser',
  components: { RegisterEntity },

  setup () {
    const User = useUserStore()
    const Entity = useEntityStore()
    const Group = useGroupStore()
    const Branch = useBranchStore()
    return { User, tdc, Entity, Group, Branch}
  },

  data () {
    return {
      branchClosed: false,
      entityClosed: false,
      pergunta: false,
      showRegisterEntity: false,
      profileSplint: profileSplint,
    }
  },

  watch: {
    'User.Group' (val) {

      if (!val) return
      
      if (this.$route.name !== 'welcome' && this.$route.name !== 'authwelcome') {
        this.$router.push({ name: 'home' })
      }

      this.User.getMenus()
    },

    'User.Entity' (val) {
      if (!val) return
      this.User.getMenus()
      this.Entity.setEntityModelos(this.User.Entity.id)
    },

    'User.isLogout' (val) {
      if (!val) return
      if (this.User.Entity){
        this.$router.push({ name: 'login' , query: { entity: this.User.Entity.id}})
      }else{
        this.$router.push({ name: 'login' })
      }
    }
  },

  
  beforeUnmount () {

  },

  methods: {

    startSessionWatcher () {
      setInterval(async () => {
        await this.User.checkSession()
      }, 60000)
    }
  },

  async mounted () {
    if (this.User) {
      this.startSessionWatcher()
    }
  }
})
</script>

