<template>
    <div >
      <q-btn class="q-mr-xs" flat square
        v-for="App in User.Menus" :key="App"
        style="padding: 0px;"
        :icon="App.icon"
        :label="(tdc(App.menu))"
      >
        
        <q-menu >
          <q-list  style="min-width: 155px">
            <SubMenu :Dados="App.submenu" />
          </q-list>
        </q-menu>
      </q-btn>
      </div>
</template>

<script >

import { defineComponent } from 'vue'
import { tdc, toPlural } from '../boot/base'
import { UserStore, TipoEntidadeStore } from '../stores/TipoEntidadeStore'
import SubMenu from './SubMenu.vue'



export default defineComponent({
  name: 'TopeMenuSegundo',

  components: {
    SubMenu
  },
  setup () {

    const User = UserStore()
    const Auth = TipoEntidadeStore()

    return {
      User,
      Auth,
      tdc,
      toPlural
    }
  },
  data () {
    return {
     
    }
  },
  computed: {

  },
  watch: {
    
  },
  mounted () {

  },
  methods: {
    
  }
})
</script>
