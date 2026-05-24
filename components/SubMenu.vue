<template>
  <q-list dense>
    <q-item
      class="q-item"
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
      <q-item-section 
        style="
        display: block;
        max-width: 146px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;"
      >
        <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white text-14' : 'bg-primary text-white text-14'">
          {{ toPlural(tdc(item.menu)) }}
        </q-tooltip>
        {{ toPlural(tdc(item.menu)) }}
      </q-item-section>

      <!-- ADD BUTTON -->
      <q-item-section side v-if="item.add_route">
        <s-btn dense flat icon="add" :to="resolveRoute(item, 1)"  color="white" />
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



<style >
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
