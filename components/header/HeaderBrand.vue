<template>
  <!-- The logo and the entity / entity-type name are one link:
       - the Entity has a site (Entity.site): one click opens it in this tab,
         a double click in a new tab;
       - otherwise, with `to` (the main layout passes the home route), it opens
         that route;
       - otherwise (login layout, no site) it is a plain, non-interactive brand. -->
  <div
    class="row items-center no-wrap q-gutter-sm header-brand"
    :class="{ 'header-brand--link cursor-pointer': interactive }"
    :role="interactive ? 'link' : undefined"
    :tabindex="interactive ? 0 : undefined"
    :title="site ? tdc('Open the website (double-click: new tab)') : (to ? tdc('Home') : undefined)"
    data-test="header-brand"
    @click="onClick"
    @dblclick="onDoubleClick"
    @keydown.enter="open"
  >
    <q-avatar size="40px">
      <img   v-if="User.Entity" :src="User?.Entity?.logo?.url" />
      <img   v-else :src="User.EntityType?.icon?.url" />
    </q-avatar>

    <div class="text-h6 text-weight-medium">
      <label v-if="User?.Entity">
        {{ tdc(User?.Entity?.name) }}

        <s-tooltip
          v-if="User?.Branch?.name"
        >
          {{ tdc(User?.Branch?.name) }}
        </s-tooltip>
      </label>
      <label v-else >{{tdc( User.EntityType?.name )}}</label>
    </div>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation';

// how long a click waits for a second one before opening in this tab
const DOUBLE_CLICK_MS = 250


export default defineComponent({
  components: {

  },
  props: {
    // route location to open when the brand is clicked (e.g. { name: 'home' })
    to: { type: [Object, String], default: null }
  },
  setup () {

    const User = useUserStore()
    return {
      User,
      tdc
    }
  },
  data () {
    return {

    }
  },
  computed: {
    // the Entity's own website - only an absolute http(s) URL is followed
    // (never javascript:, data:, a relative path...)
    site () {
      const value = String(this.User?.Entity?.site || '').trim()
      if (!value) return null
      try {
        const parsed = new URL(value)
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
      } catch {
        return null
      }
    },
    interactive () {
      return !!(this.site || this.to)
    }
  },

  mounted(){

  },

  beforeUnmount () {
    clearTimeout(this.clickTimer)
  },

  methods: {
    // same tab: the site, else the `to` route
    open () {
      if (this.site) window.open(this.site, '_self')
      else if (this.to) this.$router.push(this.to)
    },
    // a click waits a moment so a double click can still claim it
    onClick () {
      if (!this.site) return this.open()
      clearTimeout(this.clickTimer)
      this.clickTimer = setTimeout(this.open, DOUBLE_CLICK_MS)
    },
    onDoubleClick () {
      if (!this.site) return
      clearTimeout(this.clickTimer)
      window.open(this.site, '_blank', 'noopener')
    }
  }
})
</script>

<style scoped>
.header-brand--link { user-select: none; }
.header-brand--link:hover { opacity: .85; }
.header-brand--link:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 6px; }
</style>
