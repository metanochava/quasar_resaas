
<template>
  <q-layout >
    <s-card  square
        :class="$q.dark.isActive ? 'bg-dark text-white fixed-top  q-pa-sm  header-fixed' : 'bg-primary text-white   q-pa-sm fixed-top header-fixed' "
        flat
      >
      <div class="text-center text-h6">{{ User?.username }}</div>
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
      <q-list  >
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
      </q-list>
    </s-card>

    <LeftMenuSegundo :class="$q.dark.isActive ? 'bg-dark text-white fixed-top' : 'bg-primary text-white  fixed-top'" style="margin-top:127px" ></LeftMenuSegundo>

  </q-layout>
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