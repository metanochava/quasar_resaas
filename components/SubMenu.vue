<template>
  <q-list dense>
    <template v-for="item in Dados" :key="item.menu">
      <q-item
        class="q-item"
        clickable
        v-ripple
        :to="resolveRoute(item, 0)"
      >

        <!-- ICON -->
        <q-item-section avatar>
          <q-icon
            :name="item.icon || 'menu'"
            :color="$q.dark.isActive ? 'white' : 'primary'"
          />
        </q-item-section>


        <!-- TITLE (the part matching the menu search highlighted) -->
        <q-item-section
          style="
            display: block;
            max-width: 146px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          <s-tooltip>
            {{ toPlural(tdc(item.menu)) }}
          </s-tooltip>

          <HighlightText :text="toPlural(tdc(item.menu))" :search="User.search" />

        </q-item-section>


        <!-- ADD BUTTON -->
        <q-item-section
          v-if="item.add_route"
          side
        >
          <s-btn
            dense
            flat
            icon="add"
            :to="resolveRoute(item, 1)"
            :color="$q.dark.isActive ? 'white' : 'primary'"
          />
        </q-item-section>


        <!-- ARROW -->
        <q-item-section
          v-if="item.submenu?.length && !searching"
          side
        >
          <q-icon
            name="chevron_right"
          />
        </q-item-section>


        <!-- RECURSIVE SUBMENU (a popup; inline below while searching) -->
        <q-menu
          v-if="item.submenu?.length && !searching"
          anchor="top right"
          self="top left"
        >
          <SubMenu :Dados="item.submenu" />
        </q-menu>

      </q-item>

      <!-- while searching, the matching sub-items are shown opened -->
      <div v-if="item.submenu?.length && searching" class="q-pl-md">
        <SubMenu :Dados="item.submenu" />
      </div>
    </template>
  </q-list>
</template>


<script>
import { defineComponent } from 'vue'

import { resolveRoute } from '../services/routing'
import { tdc, toPlural } from '../services/translation'
import { useUserStore } from '../stores/UserStore'
import HighlightText from './engine/HighlightText.vue'


export default defineComponent({
  name: 'SubMenu',

  props: {
    Dados: {
      type: Array,
      default: () => []
    }
  },

  components: {
    HighlightText
  },

  setup () {
    const User = useUserStore()

    return {
      User,
      tdc,
      toPlural,
      resolveRoute
    }
  },

  computed: {
    searching () {
      return !!(this.User.search || '').trim()
    }
  }
})
</script>


<style>
.q-expansion-item,
.q-item,
.q-item__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-14 {
  font-weight: bold;
  font-size: 16px;
}
</style>