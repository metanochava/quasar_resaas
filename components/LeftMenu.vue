
<template>
  <s-card  square flat :class="$q.dark.isActive ? 'bg-dark  fixed-top   header-fixed' : 'bg-transparent   fixed-top header-fixed' ">
    <q-item 
      class="row items-center justify-between  "
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
        <GroupSelector />
        <s-btn
          flat
          dense
          :label="User.Group?.name"
          class="full-width"
        >
          <q-menu fit>
            <q-list
                dense
                class="group-list rounded-borders"
              >

                <q-item
                  v-for="group in User?.Groups || []"
                  :key="group?.id"
                  clickable
                  v-close-popup
                  v-ripple
                  @click="Group.select(group)"
                >

                  <q-item-section
                    class="item-content"
                  >

                    <q-item-label
                      overline
                      class="ellipsis"
                    >
                      {{
                        tdc(
                          profileSplint(
                            group?.name ||
                            group?.label
                          )
                        )
                      }}
                    </q-item-label>

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
    <div class="q-pa-sm"  >
      <search-menu size="100%" />
    </div>
  </s-card>

    <LeftMenuSegundo  style="margin-top:95px" />

</template>
<script >

import LeftMenuSegundo from './LeftMenuSegundo.vue'
import { barStyle, thumbStyle } from '../services/app'
import SearchMenu from './SearchMenu.vue'

import { defineComponent } from 'vue'
import { tdc } from '../services/translation'
import { useUserStore } from '../stores/UserStore'
import { useGroupStore } from '../stores/GroupStore.js'
import GroupSelector from './GroupSelector.vue'


export default defineComponent({
  components: {
    LeftMenuSegundo,
    SearchMenu,
    GroupSelector
  },
  setup () {
    const User = useUserStore()
    const Group = useGroupStore()
    return {
      User,
      barStyle,
      thumbStyle,
      Group
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