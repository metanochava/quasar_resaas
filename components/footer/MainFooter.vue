
<template>
  <div class="">
    <q-dialog v-model="comment" persistent>
        <Comments />
    </q-dialog>
    <q-footer
      v-if=" true" bordered
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
      :style="footerStyle"
    >
      <div v-if="footerOverlayStyle" :style="footerOverlayStyle" />
      <q-toolbar>
        <q-toolbar-title>
          <!-- one line on every screen: the copyright is cut with an ellipsis
               (the full text is its title), so the footer keeps its height -->
          <div class="row no-wrap items-center q-py-sm q-col-gutter-x-sm justify-between">
            <div class="col ellipsis main-footer__copyright" style="font-size:13px;" :title="copyright" data-test="footer-copyright">
              {{ copyright }}
            </div>
            <div class="col-auto text-right ellipsis main-footer__actions" style="font-size:12px;">
              <q-spinner-gears size="md" color="white" v-show="Load.count !==0"/>
              <label v-show="Load.count !==0">{{ Load.count }}</label> <label  @click="this.comment = !this.comment">  {{tdc('Send comment or feedback')}} </label>
            </div>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../services/translation';
import {useUserStore } from '../../stores/UserStore';
import { useLoadStore } from '../../stores/LoadStore';
import { surfaceToStyle, surfaceOverlayStyle } from '../../theme/surfaceToStyle';
import Comments from "./Comments.vue";


export default defineComponent({

  components: {
    Comments
  },

  setup () {
    // era `useUserStore` (a própria função factory, nunca chamada) -
    // por isso User?.Entity?... no template nunca resolvia nada.
    const User = useUserStore()
    const Load = useLoadStore()
    return {
      User,
      Load
    }
  },
  props: {
    css: {
      type: String,
      required: false,
      default: ''
    }
  },

  data () {
    return {
      comment: false,
      tdc: tdc,
    }
  },
  created () {
  },
  computed: {
    // Fonte única de aparência de área é theme.surfaces.footer
    // (ThemeSurface), já resolvido User > Entity > EntityType em
    // User.ps.theme (HeaderVisualFields/FooterVisualFields/
    // InterfaceConfigService foram removidos - CLAUDE.md secção 5/21).
    ps() {
      return this.User?.ps || {}
    },

    footerStyle(){
      const style = surfaceToStyle(this.ps.theme?.surfaces?.footer)

      if (this.ps.theme?.footer_text) {
        style.color = this.ps.theme.footer_text
      }

      return style
    },

    copyright(){
      const entity = this.User?.Entity
      const since = entity?.created_at == null ? '2020' : entity.created_at
      const name = entity?.name ? ': ' + entity.name : ''
      return `© ${since} - ${new Date().getFullYear()} ${entity?.entityType?.name ?? ''}${name}`
    },

    footerOverlayStyle(){
      return surfaceOverlayStyle(this.ps.theme?.surfaces?.footer)
    }
  },
  mounted () {

  },

  methods: {

  }
})
</script>

<style scoped>
.main-footer__copyright { min-width: 0; }
.main-footer__actions { max-width: 50%; }
</style>
