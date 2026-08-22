<template>
  <s-btn flat dense round
    :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
    @click="toggleFullScreen" >
    <q-tooltip :class="$q.dark.isActive ? 'bg-transparent' : 'bg-primary'">
      {{ fullscreen ? tdc('Clique para desactivar da tela cheia'): tdc('Clique para activar da tela cheia') }}
    </q-tooltip>
  </s-btn>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../../services/translation'
import { getStorage, setStorage } from '../../services/storage'
export default defineComponent({
  components: {

  },
  setup () {
    return {
    }
  },
  data () {
    return {
      fullscreen: false,
      tdc: tdc
    }
  },
  computed: {

  },

  mounted(){
    document.addEventListener("fullscreenchange", () => {
      this.fullscreen = !!document.fullscreenElement
    })
    this.fullscreen = ('' + getStorage('l', 'FullScreen')).toLowerCase() === 'true'
  },

  methods: {
    toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        this.fullscreen = !!document.fullscreenElement
        setStorage('l', 'FullScreen', this.fullscreen)
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
        this.fullscreen = !!document.fullscreenElement
        setStorage('l', 'FullScreen', this.fullscreen)
      }

    }
  }
})
</script>