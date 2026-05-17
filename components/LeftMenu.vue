
<template>
    
 
<div v-for="i in 40" :key="i">
    Right Menu <br><br><br>
</div>

    <LeftMenuSegundo :class="$q.dark.isActive ? 'bg-dark text-white fixed-top' : 'bg-primary text-white  fixed-top'" style="margin-top:127px" ></LeftMenuSegundo>

</template>
<script >

import LeftMenuSegundo from './LeftMenuSegundo.vue'

import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { useUserStore } from '../stores/UserStore'

export default defineComponent({
  components: {
    LeftMenuSegundo
  },
  setup () {
    const User = useUserStore()
    return {
      User,
    }
  },

  data () {
    return {
      tdc: tdc,
      active: null,
    }
  },

  created () {
  },
  computed: {
  },

  mounted () {

  },

  methods: {

  }
})
</script>

<style scoped>
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>