<template>
  <div>
    <!-- Conteúdo do HeaderServices -->
    <s-btn round dense flat  size="14px" icon="apps">
          <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'" >{{tdc("Serviços")}}</q-tooltip>
          <q-menu flat bordered square  fit :offset="[175, 5]"  >
            <s-card class="my-card"  style="min-width:270px;" >
                <q-card-section class="text-center"   flat bordered square  >
                  <q-scroll-area
                    :thumb-style="thumbStyle"
                    :bar-style="barStyle"
                    style="height: 300px"
                  >
                    <div class="row col-xs-12"  >
                      <div  v-for=" te in TipoEntidade?.TipoEntidades" :key="te">
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
              </s-card>
          </q-menu>
      </s-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../boot/base'
import { useUserStore } from '../../stores/UserStore'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'
import { setStorage } from '../../boot/storage';


export default defineComponent({

  setup () {
    const User = useUserStore()
    const TipoEntidade = useTipoEntidadeStore()
    return {
      User,
      TipoEntidade
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
    await this.TipoEntidade.getTipoEntidades()
          console.log("antes do loop")
    this.TipoEntidade?.rows?.forEach(async tipoEntidade => {
      console.log("no loop")
      await this.getHostname(tipoEntidade)
    })

    console.log("montado o header Service")
  },

  methods: {
    isIP(host) {
      return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
    },

    async getHostname (tipoEnt) {
      console.log("semmmmmm")
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
          console.log(domain.toLocaleLowerCase(), tipoEnt.nome.toLowerCase(),  "diferente")
          return true
        } else {
          console.log(domain.toLocaleLowerCase(), tipoEnt.nome.toLowerCase(),  "igual")
          this.User.TipoEntidade = tipoEnt
          this.TipoEntidade.row = tipoEnt
          await this.TipoEntidade.getLayoutSettings(tipoEnt?.id)
          setStorage('l', 'tipoEntidade', JSON.stringify(this.User.TipoEntidade))
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
