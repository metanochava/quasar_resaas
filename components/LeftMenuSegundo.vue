<template>
  <div
    class="overflow-hidden q-pa-0"
    :class="$q.dark.isActive ? 'bg-transparent  text-white ' : 'bg-transparent text-white  '"
    :style="{
      width: sidebarWidth + 'px',
      marginTop: '94px',
      marginLeft: '-2px',
      height: 'calc(100vh - 255px)'
    }"
  >

    <q-scroll-area
      :thumb-style="thumbStyle"
      :bar-style="barStyle"
      style="
        height: calc(100vh - 255px);
        width: 100%;
      "
    >

      <q-list
        class=" q-pa-0"
        :style="{ width: sidebarWidth - 10 + 'px' }"
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

          dense

          :header-class="
            $q.dark.isActive
              ? 'bg-dark text-white'
              : 'bg-primary text-white'
          "

          :header-style="isMini ? { padding: '0', justifyContent: 'center' } : {}"

          :expand-icon-class="isMini ? 'mini-expand-icon' : 'text-white'"

          expand-icon="chevron_right"

        >

          <!-- Custom #header (instead of the icon/label props) so a
               hover tooltip can attach directly to the always-visible
               icon when mini hides the label - QExpansionItem still
               appends its own expand-icon-side toggle automatically
               regardless of this slot (Quasar's own
               getHeaderChild()/getToggleIcon()). -->
          <template #header>
            <q-item-section avatar>
              <q-icon :name="App.icon" />
              <s-tooltip v-if="isMini" anchor="center right" self="center left">
                {{ tdc(App.menu) }}
              </s-tooltip>
            </q-item-section>

            <q-item-section v-if="!isMini">
              {{ tdc(App.menu) }}
            </q-item-section>
          </template>

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
import { useUserStore } from '../stores/UserStore'
import { useEntityTypeStore } from '../stores/EntityTypeStore'
import SubMenu from './SubMenu.vue'
import { barStyle, thumbStyle } from '../services/app'
import { tdc, toPlural } from '../services/translation'


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
    // Mirrors the same User.ps.layout.sidebar QDrawer itself reads in
    // MainLayout.vue (layout_setting.py's to_dict()) - QDrawer's own
    // `mini` prop only resizes the drawer shell, it doesn't know this
    // component exists, so its width/labels have to follow the same
    // source independently.
    isMini () {
      return !!this.User.ps?.layout?.sidebar?.mini
    },

    sidebarWidth () {
      return this.isMini
        ? (80)
        : ( 320)
    }
  },
  watch: {

  },
  mounted () {

  },
  methods: {

  }
})
</script>

<style>
/* Deliberately global (not scoped) - expand-icon-class is applied by
   q-expansion-item onto an icon element it renders internally, which a
   scoped style's data-v-xxxx attribute selector would never match.
   Quasar ships no plain .hidden utility, hence a real class here. */
.mini-expand-icon {
  display: none;
}
</style>
