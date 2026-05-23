<template>
  <div
    class="overflow-hidden q-pa-0"
    :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-transparent text-white  '"
    style="
      width: 300px;
      margin-top: 94px;
      margin-left: -2px;
      height: calc(100vh - 205px);
    "
  >

    <q-scroll-area
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      style="
        height: calc(100vh - 205px);
        width: 100%;
      "
    >

      <q-list
        class=" q-pa-0"
        style="
          width: 290;

        "
      >

        <q-expansion-item
          v-for="App in User.Menus"
          :key="App"
          class=" q-expansion-item q-pa-0"

          :class="
            $q.dark.isActive
              ? 'bg-dark-saas text-subtitle1 text-white'
              : 'text-subtitle1 text-white'
          "

          :icon="App.icon"
          dense

          :label="tdc(App.menu)"

          :header-class="
            $q.dark.isActive
              ? 'bg-dark text-white'
              : 'bg-primary text-white'
          "

          :expand-icon-class="'text-white'"
        >

          <q-separator />
          <SubMenu :Dados="App.submenu" />
          <q-separator />
        </q-expansion-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>


<script >

import { defineComponent, h } from 'vue'
import { tdc, toPlural} from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import SubMenu from './SubMenu.vue'
import { barStyle, thumbStyle } from '../boot/app'


export default defineComponent({
  name: 'LeftMenuSegundo',

  components: {
    SubMenu
  },
  setup () {
    const EntityType = useEntityTypeStore()
    const  User = useUserStore()
    return {
      EntityType,
      User,
      tdc,
      toPlural,
      barStyle,
      thumbStyle
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
