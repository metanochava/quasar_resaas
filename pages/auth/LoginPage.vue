<template>
  <div class="q-pa-md text-center" >
    <FormLogin />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import { UserStore } from './../../stores/TipoEntidadeStore'
import FormLogin from './../../components/FormLogin.vue'

export default defineComponent({
  components: {
    FormLogin,
  },
  setup() {
    const User = UserStore()
    return {
      User,
    }
  },
  data() {
    return {}
  },
  computed: {},

  mounted() {},

  methods: {},
})
</script>
