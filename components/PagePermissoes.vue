<template>
  <div class="q-pa-md q-gutter-sm">
    <h2>{{ tdc('Page permissoes') }}</h2>
  </div>
</template>
<script >

import { defineComponent } from 'vue'
import { tdc } from '../services/translation'


export default defineComponent({
  components: {

  },
  setup () {
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
