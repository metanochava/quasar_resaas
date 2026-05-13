<template>
  <q-list dense>
    <q-item
      v-for="item in Dados"
      :key="item.menu"
      clickable
      v-ripple
      :to="resolveRoute(item, 0)"
    >
      <!-- Icon -->
      <q-item-section avatar>
        <q-icon :name="item.icon || 'menu'" />
      </q-item-section>

      <!-- Title -->
      <q-item-section>
        {{ toPlural(tdc(item.menu)) }}
      </q-item-section>

      <!-- ADD BUTTON -->
      <q-item-section side v-if="item.add_route">
        <s-btn dense flat icon="add" :to="resolveRoute(item, 1)" />
      </q-item-section>

      <!-- Arrow if has submenu -->
      <q-item-section side v-if="item.submenu?.length">
        <q-icon name="chevron_right" />
      </q-item-section>

      <!-- Recursive submenu -->
      <q-menu v-if="item.submenu?.length" anchor="top right" self="top left">
        <SubMenu :Dados="item.submenu" />
      </q-menu>

    </q-item>

  </q-list>
</template>

<script>
import { defineComponent } from 'vue'
import { resolveRoute, tdc, toPlural } from '../boot/base'


export default defineComponent({
  name: 'SubMenu',

  props: {
    Dados: {
      type: Array,
      default: () => []
    }
  },

  setup () {
    return { tdc, toPlural, resolveRoute}
  }
})
</script>
