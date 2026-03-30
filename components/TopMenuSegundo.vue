<template>
  <div >
    <s-btn class="q-mr-xs" flat squaree
      v-for="App in User.Menus" :key="App"
      style="padding: 0px; margin-right:25px;"
      :icon="App.icon"
      :label="(tdc(App.menu))"
    >

      <q-menu >
        <q-list  style="min-width: 155px">
          <SubMenu :Dados="App.submenu" />
        </q-list>
      </q-menu>
    </s-btn>
  </div>
</template>

<script >

import { defineComponent } from 'vue'
import { tdc, toPlural } from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import { useTipoEntidadeStore } from '../stores/TipoEntidadeStore'
import SubMenu from './SubMenu.vue'



export default defineComponent({
  name: 'TopeMenuSegundo',

  components: {
    SubMenu
  },
  setup () {

    const User = useUserStore()
    const Auth = useTipoEntidadeStore()

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
