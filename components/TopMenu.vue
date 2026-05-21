<template>
    <div class="q-pa-sm  items-center text-body1 " style="margin-left: 20px; width:290px;">
      <q-item
        class="row items-center justify-between full-width "
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
    </div>

    <TopMenuSegundo ></TopMenuSegundo>
    <q-space />
    <SearchMenu  size="200px" style="margin-right: 30px;"/>
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
