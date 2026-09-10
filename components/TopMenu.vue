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
          <GroupSelector />
          <s-btn
            flat
            dense
            :label="profileSplint(User.Group?.name || User.Group?.label)"
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
    </div>

    <TopMenuSegundo ></TopMenuSegundo>
    <q-space />
    <SearchMenu  size="200px" style="margin-right: 30px;"/>
</template>
<script >

import TopMenuSegundo from './TopMenuSegundo.vue'
import { defineComponent } from 'vue'
import { tdc } from '../services/translation'
import { useUserStore } from '../stores/UserStore'
import SearchMenu from './SearchMenu.vue';
import { profileSplint } from '../utils/profile.js'
import GroupSelector from './GroupSelector.vue'

export default defineComponent({
  name: 'TopMenu',
  components: {
    TopMenuSegundo,
    SearchMenu,
    GroupSelector
  },
  setup () {
    const User = useUserStore()
    return {
      User,
      profileSplint
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
