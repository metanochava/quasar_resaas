<template>
  <div>
    <!-- HeaderServices content -->
    <s-btn round dense flat  size="14px" icon="apps">
          <s-tooltip>{{tdc("Services")}}</s-tooltip>
          <q-menu flat bordered square  fit :offset="[175, 5]"  >
            <s-card class="my-card"  style="min-width:270px;" >
                <q-card-section class="text-center"   flat bordered square  >
                  <q-scroll-area
                    :thumb-style="thumbStyle"
                    :bar-style="barStyle"
                    style="height: 300px"
                  >
                    <div class="row col-xs-12"  >
                      <div  v-for=" te in User.EntityTypes" :key="te">
                        <q-item   v-close-popup   flat bordered   class="col-4 " v-if="getHostname(te)"  >
                          <q-item-label  clickable @click="selectteidadeLink(te)"  class="localhover">
                            <q-avatar class="" size="45px" style="border-radius:5px;" >
                              <img :src="te?.icon?.url" >
                            </q-avatar>
                            <br>
                            {{tdc(te.name)}}
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
import { tdc } from '../../services/translation'
import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { setStorage } from '../../services/storage';
import { entityTypeKey, entityTypeUrl, isIpHost } from '../../utils/entityTypeHost'


export default defineComponent({

  setup () {
    const User = useUserStore()
    const EntityType = useEntityTypeStore()
    return {
      User,
      EntityType
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
    await this.EntityType.getEntityTypes()
    this.User.EntityTypes?.forEach(async entityType => {
      await this.getHostname(entityType)
    })
  },

  methods: {
    isIP(host) {
      return isIpHost(host)
    },

    async getHostname (tipoEnt) {
      // the EntityType of this host (utils/entityTypeHost.js, shared with
      // the site page at '/')
      const domain = entityTypeKey()

      if(domain){
        if (domain.toLocaleLowerCase() !== tipoEnt.name.toLowerCase()) {
          return true
        } else {
          this.User.EntityType = tipoEnt
          this.EntityType.row = tipoEnt
          await this.EntityType.getLayoutSettings(tipoEnt?.id)
          setStorage('l', 'entityType', JSON.stringify(this.User.EntityType))
          return false
        }
      }

    },



    selectteidadeLink(x){
      window.open(entityTypeUrl(x), '_blank');
    }

  }
})
</script>
