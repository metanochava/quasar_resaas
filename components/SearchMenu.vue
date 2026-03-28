<template>
  <div>
    <input
      v-model="User.search"
      :style="'height: 30px; line-height: 30px; width: '+size+'px; padding: 0 8px;'"
      @input="filterMenus(User.search)"
      :placeholder="tdc('Procurar')"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/AuthStore'

export default defineComponent({
  name: 'SearchMenu',

  props: {
    size: {
      type: String,
      default: '300'
    }
  },

  setup () {
    const User = useUserStore()
    return { User, tdc }
  },

  mounted () {
    this.filterMenus(this.User.search)
  },

  methods: {

    filterMenuRecursive(menu, search) {
      if (!search) return menu
      search = search.toLowerCase()

      return menu
        .map(item => {
          const children = item.submenu 
            ? this.filterMenuRecursive(item.submenu, search)
            : []

          const match = item.menu?.toLowerCase().includes(search)

          if (match || children.length) {
            return { ...item, submenu: children }
          }

          return null
        })
        .filter(Boolean)
    },

    filterMenus(val) {
      if (!val || val.trim() === '') {
        this.User.Menus = this.User.AllMenus
      } else {
        this.User.Menus = this.filterMenuRecursive(this.User.AllMenus, val)
      }
    }

  }
})
</script>
