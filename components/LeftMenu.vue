
<template>
    <s-card  square flat :class="$q.dark.isActive ? 'bg-dark text-white fixed-top  q-pa-0  header-fixed' : 'bg-saas text-white   q-pa-0 fixed-top header-fixed' ">
      <div :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary' ">
        <div class="text-center text-h6 q-pt-lg">

          {{ User?.username }}
        </div>
        <s-btn
          flat dense
          :label="User.Group?.name"
          class="full-width"
        >
          <q-menu fit>
            <q-list dense>
              <q-item v-for="group in User.Groups" :key="group.id" clickable @click="User.selectGroup(group)">
                <q-item-section>{{ group.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </s-btn>
      </div>
      
  
        <q-item clickable replace v-ripple  exact
          :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
          exact-active-class=""  >
          <q-item-section avatar @click="$router.push({ name: 'home'})">
            <q-icon  name="home" />
          </q-item-section>
          <q-item-section class="text-h6" @click="$router.push({ name: 'home'})">{{ tdc('Casa') }}</q-item-section>
          <q-item-section side >
            <s-btn
            round dense flat
            :icon="'settings'" :class="$q.dark.isActive ? 'text-white' : 'text-white'"
            @click="User.toggleSettings()"
          >
          <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc('Configurações') }}</q-tooltip>
          </s-btn>
          </q-item-section>
        </q-item>

    </s-card>

  <LeftMenuSegundo :class="$q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white  '" style="margin-top:137px" ></LeftMenuSegundo>

</template>
<script >

import LeftMenuSegundo from './LeftMenuSegundo.vue'

import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/UserStore'

export default defineComponent({
  components: {
    LeftMenuSegundo
  },
  setup () {
    const User = useUserStore()
    return {
      User,
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

<style scoped>
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>