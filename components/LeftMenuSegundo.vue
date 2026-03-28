<template>
  <div class="col-12" style="margin-top: 2px;">
    <search-menu :size="'300'" />
    <s-card
      square
      flat
      class="col-xs-12 col-md-12 col-lg-12 q-bt-md"
      v-for="App in User.Menus"
      :key="App"
      style="padding: 0px"
    >
      <q-expansion-item
        default-opened
        :class="
          $q.dark.isActive
            ? 'bg-dark-custom text-subtitle1'
            : 'bg-white text-subtitle1 text-primary'
        "
        :icon="App.icon"
        dense
        :label="(tdc(App.menu))"
        :header-class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
        :expand-icon-class="$q.dark.isActive ? 'text-white' : 'text-white'"
      >
        <q-separator />
          <SubMenu :Dados="App.submenu" />
        <q-separator />
      </q-expansion-item>
    </s-card>
  </div>
</template>


<style scoped>
  .bg-dark-custom {
    background-color: #121212 !important;
  }
</style>
<script >


import { defineComponent } from 'vue'
import { tdc, toPlural} from '../boot/base'
import { useTipoEntidadeStore, useUserStore } from '../stores/AuthStore'
import SearchMenu from './SearchMenu.vue'
import SubMenu from './SubMenu.vue'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SearchMenu,
    SubMenu
  },
  setup () {
    const Auth = useTipoEntidadeStore()
    const  User = useUserStore()
    return {
      Auth,
      User,
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
