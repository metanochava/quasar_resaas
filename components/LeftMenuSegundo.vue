<template>
  <div class="col-12" style="margin-top: 2px;">
    <search-menu :size="'300'" />
    <s-card
      square
      flat
      v-for="App in User.Menus"
      :key="App"
      style="padding: 0px"
      :class="
          $q.dark.isActive
            ? 'bg-dark-custom  col-xs-12 col-md-12 col-lg-12 q-bt-md'
            : 'bg-saas-premium bg-left-menu-premium  text-primary  col-xs-12 col-md-12 col-lg-12 q-bt-md'"
    >
      <q-expansion-item
        group="menu"
        default-opened
        :class="
          $q.dark.isActive
            ? 'bg-dark-custom text-subtitle1'
            : 'bg-transparent text-subtitle1 text-primary'
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
import { useUserStore } from '../stores/UserStore'
import { useTipoEntidadeStore } from '../stores/TipoEntidadeStore'
import SearchMenu from './SearchMenu.vue'
import SubMenu from './SubMenu.vue'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SearchMenu,
    SubMenu
  },
  setup () {
    const TipoEntidade = useTipoEntidadeStore()
    const  User = useUserStore()
    return {
      TipoEntidade,
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
