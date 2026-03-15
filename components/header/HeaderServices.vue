<template>
  <div>
    <!-- Conteúdo do HeaderServices -->
    <q-btn round dense flat  size="14px" icon="apps">
          <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" >{{tdc("Serviços")}}</q-tooltip>
          <q-menu flat bordered square  fit :offset="[175, 5]"  >
            <q-card class="my-card"  style="min-width:270px;" >
                <q-card-section class="text-center"   flat bordered square  >
                  <q-scroll-area
                    :thumb-style="thumbStyle"
                    :bar-style="barStyle"
                    style="height: 300px"
                  >
                    <div class="row col-xs-12"  >
                      <div  v-for=" te in Auth?.TipoEntidades" :key="te">
                        <q-item   v-close-popup   flat bordered   class="col-4 " v-if="getHostname(te)"  >
                          <q-item-label  clickable @click="selectteidadeLink(te)"  class="localhover">
                            <q-avatar class="" size="45px" style="border-radius:5px;" >
                              <img :src="te?.icon?.url" >
                            </q-avatar>
                            <br>
                            {{tdc(te.nome)}}
                          </q-item-label>
                        </q-item  >
                        </div>
                    </div>
                  </q-scroll-area>
                </q-card-section>
              </q-card>
          </q-menu>
      </q-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../boot/base'
import { TipoEntidadeStore, UserStore } from '../../stores/AuthStore'
import { setStorage } from '../../boot/storage';


export default defineComponent({

  setup () {
    const User = UserStore()
    const Auth = TipoEntidadeStore()
    return {
      User,
      Auth
    }
  },
  props: {

  },

  data () {
    return {
      tdc: tdc
    }
  },
  created () {
  },
  computed: {
  },
  async mounted () {
    await this.Auth.getTipoEntidades()
    this.Auth?.TipoEntidades?.forEach(entidade => {
      this.getHostname(entidade)
    })
  },

  methods: {
    isIP(host) {
      return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
    },
    getHostname (tipoEnt) {
      let domain = ''

      if (this.isIP(window.location.hostname)){
        const url = new URL(window.location.href);
        const tipoentidade = url.pathname.split("/").filter(Boolean)[0];
        domain = tipoentidade

      }else{
        domain = window.location.href.split('/')[2].split('.')[0]
        if (domain === 'www') {
          domain = window.location.href.split('/')[2].split('.')[1]
        }
      }

      if(domain){
        if (domain.toLocaleLowerCase() !== tipoEnt.nome.toLowerCase()) {
          return true
        } else {
          this.User.TipoEntidade = tipoEnt
          this.Auth.TipoEntidade = tipoEnt
          this.User.setTipoEntidadeLayoutSettings()
          setStorage('c', 'tipoEntidade', JSON.stringify(this.User.TipoEntidade))
          return false
        }
      }

    },



    selectteidadeLink(x){
      var url = ''
      if (this.isIP(window.location.hostname)){
        url = new URL(window.location.href)
        url.pathname = `/${x.nome}/`
      }else{
        const parts = window.location.hostname.split('.')
        parts[0] = x.nome
        url = `${window.location.protocol}//${parts.join('.')}`
      }
      window.open(url.toString(), '_blank');
    }

  }
})
</script>
