<template>
  <q-page class="column">

    <s-card
      flat
      class="col"
      :class="
        $q.dark.isActive
          ? 'bg-dark text-white q-pa-md text-center'
          : 'bg-saas q-pa-md text-center'
      "
    >
      <FormLogin />
    </s-card>

  </q-page>
</template>


<script>
import { defineComponent } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import FormLogin from './../../components/FormLogin.vue'

export default defineComponent({
  components: {
    FormLogin,
  },
  setup() {
    const User = useUserStore()
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
