<template>
  <div class="q-pa-sm q-gutter-sm">
    <h2>Definicoes</h2>

    {{ User.Theme }} 
    <br>
    <br>
    <br>
    {{ User.LayoutSettings }} 

  </div>
</template>
<script >

import { defineComponent } from 'vue'
import { tdc } from '../boot/base'
import { UserStore } from '../stores/AuthStore';


export default defineComponent({
  components: {

  },
  setup () {
    const User = UserStore()
    return {
      User
    }
  },
  data () {
    return {
      tdc: tdc,
    }
  },
  methods: {

  },
  created () {
  },
  computed: {
  },
  mounted () {

  }
})
</script>
