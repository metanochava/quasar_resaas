<template>
  <div>
    <input
      v-model="User.search"
      :style="'height: 30px; line-height: 30px; width: '+size+'; padding: 0 8px;'"
      @input="filterMenus(User.search)"
      :placeholder=" isSidebarMini? tdc('Sea') : tdc('Search')"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc, toPlural } from '../services/translation'
import { matchesSearch } from '../utils/highlight'
import { useUserStore } from '../stores/UserStore'

export default defineComponent({
  name: 'SearchMenu',

  props: {
    size: {
      type: String,
      default: '100%'
    }
  },

  computed: {
    isSidebarMini () {
      return !!this.User.ps?.layout?.sidebar?.mini
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

    // a menu matches by what the user reads (translated, as shown - plural in
    // the submenus) or by its canonical name; case- and accent-insensitive.
    // A matching group keeps all its children; otherwise only the matching path.
    filterMenuRecursive(menu, search) {
      if (!search) return menu

      return menu
        .map(item => {
          const match = [item.menu, tdc(item.menu), toPlural(tdc(item.menu))]
            .some(text => matchesSearch(text, search))

          if (match) return { ...item }

          const children = item.submenu
            ? this.filterMenuRecursive(item.submenu, search)
            : []

          return children.length ? { ...item, submenu: children } : null
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
