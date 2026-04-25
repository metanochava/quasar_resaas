
<template>
  <div>
    <q-dialog
        v-model="showRegistarEntidade"
        persistent
        :maximized="maximizedToggle"
        full-height
      >
      <RegistarEntidade />
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
            <s-btn flat   class="col-12" color="primary"  @click="pergunta = false, User.logout(User.Entidade?.id)" > {{tdc(User.Entidade?.nome)}}</s-btn>
          </q-card-actions>

          <q-card-actions class="row" >
            <s-btn flat   class="col-12" color="primary"  @click="pergunta = false, User.logout('x')" > {{tdc(User?.TipoEntidade?.nome)}}</s-btn>
          </q-card-actions>
          <q-separator/>
          <q-card-actions class="row" >
            <s-btn  class="col-12" flat v-close-popup>{{tdc('Cancelar')}}</s-btn>
          </q-card-actions>
        </s-card>

    </q-dialog>

    <s-btn round flat>
      <q-avatar class="" size="45px" :class="$q.dark.isActive ? 'bg-white' : 'bg-white'" >
        <img  :src="User?.perfil" >
        <q-card-actions align="center" v-if="User" flat>
          <div class="text-h6 text-gry-8 row text-center">{{User?.username}}</div>
        </q-card-actions>
        <q-separator />
        <q-menu flat  square  fit :offset="[130, 5]"  >
          <s-card class="my-card"  style="width:270px;"  flat bordered square  >
            <q-card-actions class="text-center row" v-if="User">
              <div class=" col-12">
                <q-avatar class="" size="120px"  >
                  <img   :src="User?.perfil" >
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
                :label="User?.Entidade?.nome || tdc('Entidade') "
                header-class=" text-grey-9"
                v-model="entidadeClosed"
              >
                <q-separator />
                <q-item dense clickable v-if="User.TipoEntidade?.crair_entidade"   :to="{name:'add_entidade_self', params:{}}"  >
                  <q-item-section>
                    <center><q-item-label overline class="text-blue"> {{ tdc('Registar Entidade')}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
                <q-item dense clickable v-for="entidade in User?.Entidades" :key="entidade?.id" @click=" entidadeClosed = false, sucursalClosed = true, Entidade.select(entidade)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc((entidade?.nome))}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

              <q-expansion-item
                v-if="User.data"
                dense
                group="group"
                :label="User?.Sucursal?.nome || tdc('Sucursal') "
                header-class=" text-grey-9"
                v-model="sucursalClosed"
              >
                <q-separator />
                <q-item dense clickable v-for="sucursal in User?.Sucursals" :key="sucursal?.id"   @click=" sucursalClosed = false, Sucursal.select(sucursal)">
                  <q-item-section>
                    <center><q-item-label overline> {{ tdc(sucursal?.nome)}}</q-item-label> </center>
                  </q-item-section>
                </q-item>
              </q-expansion-item>

            <s-btn dense  flat  size="" @click="sucursalClosed = false" color="grey" :label="tdc(perfilSplint(User?.Group?.name)) " style="width: 100%; border-color: transparent;">
              <q-menu fit>
                <q-list dense   class="rounded-borders" style="min-width: 100px" >

                  <q-item clickable v-close-popup @click="Group.select(group)" v-ripple v-for=" group in User.Groups" :key="group.id">
                    <q-item-section>
                      <q-item-label overline> {{ tdc(perfilSplint(group.name))}}</q-item-label>

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
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-if="User">{{User?.username }} </q-tooltip>
      <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" v-else>{{tdc('Hóspede')}}</q-tooltip>
    </s-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { perfilSplint, tdc } from '../../boot/base'
import { useUserStore } from '../../stores/UserStore'
import { useGroupStore } from '../../stores/GroupStore'
import { useEntidadeStore } from '../../stores/EntidadeStore'
import { useSucursalStore } from '../../stores/SucursalStore'
import RegistarEntidade from './RegistarEntidade.vue'


export default defineComponent({
  name: 'HeaderUser',
  components: { RegistarEntidade },

  setup () {
    const User = useUserStore()
    const Entidade = useEntidadeStore()
    const Group = useGroupStore()
    const Sucursal = useSucursalStore()
    return { User, tdc, Entidade, Group, Sucursal}
  },

  data () {
    return {
      sucursalClosed: false,
      entidadeClosed: false,
      pergunta: false,
      showRegistarEntidade: false,
      perfilSplint: perfilSplint,
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

    'User.Entidade' (val) {
      if (!val) return
      this.User.getMenus()
      this.Entidade.setEntidadeModelos(this.User.Entidade.id)
    },

    'User.isLogout' (val) {
      if (!val) return
      if (this.User.Entidade){
        this.$router.push({ name: 'login' , query: { entidade: this.User.Entidade.id}})
      }else{
        this.$router.push({ name: 'login' })
      }
    }
  },

  methods: {
    startSessionWatcher () {
      setInterval(async () => {
        await this.User.checkSession()
      }, 1 * 60 * 1000)
    }
  },
  beforeUnmount () {

  },

  async mounted () {
    this.sucursalClosed = false

    if(this.User){
      this.startSessionWatcher()
    }
  }
})
</script>
