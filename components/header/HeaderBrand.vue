<template>
  <!-- With `to` (the main layout passes the home route) the logo and the
       entity / entity-type name are one link; without it (login layout) it is
       a plain, non-interactive brand. A name that does not fit is cut with an
       ellipsis on one line, so the header keeps its height; the full name is
       in the tooltip. -->
  <div
    class="row items-center no-wrap q-gutter-sm header-brand"
    :class="{ 'header-brand--link cursor-pointer': to }"
    :role="to ? 'link' : undefined"
    :tabindex="to ? 0 : undefined"
    :title="to ? tdc('Home') : undefined"
    data-test="header-brand"
    @click="go"
    @keydown.enter="go"
  >
    <q-avatar size="40px" class="header-brand__logo">
      <img   v-if="User.Entity" :src="User?.Entity?.logo?.url" />
      <img   v-else :src="User.EntityType?.icon?.url" />
    </q-avatar>

    <div class="text-h6 text-weight-medium ellipsis header-brand__name" data-test="header-brand-name">
      <label v-if="User?.Entity">
        {{ tdc(User?.Entity?.name) }}

        <s-tooltip>
          {{ tdc(User?.Entity?.name) }}
          <template v-if="User?.Branch?.name"><br>{{ tdc(User?.Branch?.name) }}</template>
        </s-tooltip>
      </label>
      <label v-else >
        {{tdc( User.EntityType?.name )}}
        <s-tooltip>{{ tdc(User.EntityType?.name) }}</s-tooltip>
      </label>
    </div>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation';


export default defineComponent({
  components: {

  },
  props: {
    // route location to open when the brand is clicked (e.g. { name: 'dashboard' })
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

  },

  mounted(){

  },

  methods: {
    go () {
      if (this.to) this.$router.push(this.to)
    }
  }
})
</script>

<style scoped>
/* shrink inside the no-wrap toolbar instead of wrapping onto a second line */
.header-brand { min-width: 0; flex: 0 1 auto; }
.header-brand__logo { flex-shrink: 0; }
.header-brand__name { min-width: 0; }
.header-brand__name label { cursor: inherit; }
.header-brand--link { user-select: none; }
.header-brand--link:hover { opacity: .85; }
.header-brand--link:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 6px; }
</style>
