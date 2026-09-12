<template>
  <q-list dense>
    <q-item
      v-for="item in Dados"
      :key="item.menu"
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


      <!-- TITLE -->
      <q-item-section
        style="
          display: block;
          max-width: 146px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        "
      >
        <q-tooltip
          :class="
            $q.dark.isActive
              ? 'bg-dark text-white text-14'
              : 'bg-primary text-white text-14'
          "
        >
          {{ toPlural(tdc(item.menu)) }}
        </q-tooltip>

        {{ toPlural(tdc(item.menu)) }}

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
        v-if="item.submenu?.length"
        side
      >
        <q-icon
          name="chevron_right"
        />
      </q-item-section>


      <!-- RECURSIVE SUBMENU -->
      <q-menu
        v-if="item.submenu?.length"
        anchor="top right"
        self="top left"
      >
        <SubMenu :Dados="item.submenu" />
      </q-menu>

    </q-item>
  </q-list>
</template>


<script>
import { defineComponent } from 'vue'

import { resolveRoute } from '../services/routing'
import { tdc, toPlural } from '../services/translation'


export default defineComponent({
  name: 'SubMenu',

  props: {
    Dados: {
      type: Array,
      default: () => []
    }
  },

  setup () {
    return {
      tdc,
      toPlural,
      resolveRoute
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