<template>
    <div class="q-pa-sm  items-center text-body1" style="width:300px;">
      <div class="q-ml-md cursor-pointer non-selectable" >
        <q-item  dense replace v-ripple  :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"  >
          <q-item-section  @click="$router.push({ name: 'home'})" >
            <q-icon  name="home" />
          </q-item-section>
          <!-- <q-item-section class="text-body1" @click="$router.push({ name: 'home'})" >{{ tdc('Casa') }}</q-item-section> -->
          
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

          <q-item-section side>
            <s-btn
              round dense flat
              :icon="'settings'" :class="$q.dark.isActive ? 'text-white' : 'text-white'"
              @click="User.toggleSettings()"
            >
              <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">{{ tdc('Configurações') }}</q-tooltip>
            </s-btn>
          </q-item-section>
        </q-item>
      </div>
    </div>

    <TopMenuSegundo ></TopMenuSegundo>
    <q-space />
    <SearchMenu  :size="'200'" style="margin-right: 30px;"/>
</template>
<script >

import TopMenuSegundo from './TopMenuSegundo.vue'
import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/UserStore'
import SearchMenu from './SearchMenu.vue';

export default defineComponent({
  name: 'TopMenu',
  components: {
    TopMenuSegundo,
    SearchMenu
  },
  setup () {
    const User = useUserStore()
    return {
      User
    }
  },

  data () {
    return {
      tdc: tdc,
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
