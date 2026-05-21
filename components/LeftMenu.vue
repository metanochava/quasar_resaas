
<template>
  <s-card  square flat :class="$q.dark.isActive ? 'bg-dark  fixed-top   header-fixed' : 'bg-transparent   fixed-top header-fixed' ">
    <q-item style="margin-righ: -20px;"
      class="row items-center justify-between "
      :class="$q.dark.isActive
        ? 'bg-dark text-white'
        : 'bg-primary text-white'"
    >

      <!-- 🔥 ESQUERDA -->
      <div class="row items-center">

        <s-btn
          flat
          round
          dense
          icon="home"
          @click="$router.push({ name: 'home' })"
        />

      </div>

      <!-- 🔥 CENTRO -->
      <div class=" col row items-center">
        <s-btn
          flat
          dense
          :label="User.Group?.name"
          class="full-width"
        >
          <q-menu fit>

            <q-list dense>

              <q-item
                v-for="group in User.Groups"
                :key="group.id"
                clickable
                @click="User.selectGroup(group)"
              >
                <q-item-section>
                  {{ group.name }}
                </q-item-section>

              </q-item>

            </q-list>

          </q-menu>

        </s-btn>

      </div>

      <!-- 🔥 DIREITA -->
      <div class="row items-center">

        <s-btn
          round
          dense
          flat
          icon="settings"
          class="text-white"
          @click="User.toggleSettings()"
        />

      </div>

    </q-item>
    <div class="q-px-md"  >
      <search-menu size="100%" />
    </div>
  </s-card>

  <!-- <q-scroll-area 
    class=" bg-grey"
    :thumb-style="thumbStyle"
    :bar-style="barStyle"
    
  >  -->
    <LeftMenuSegundo :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primar text-white  '" style="margin-top:100px" />

  <!-- </q-scroll-area> -->

</template>
<script >

import LeftMenuSegundo from './LeftMenuSegundo.vue'
import { barStyle, thumbStyle } from '../boot/app'
import SearchMenu from './SearchMenu.vue'

import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/UserStore'

export default defineComponent({
  components: {
    LeftMenuSegundo,
    SearchMenu
  },
  setup () {
    const User = useUserStore()
    return {
      User,
      barStyle,
      thumbStyle
    }
  },

  data () {
    return {
      tdc: tdc,
      active: null,
    }
  },

  created () {
  },
  computed: {
  },

  mounted () {

  },

  methods: {

  }
})
</script>

<style >
.search-fixed {
    position: fixed;
    z-index: 9;
  }
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>