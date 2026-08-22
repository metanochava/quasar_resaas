<template>
  <s-btn flat round dense @click="verNotificacoes()" 
   :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
  >
    <q-icon name="notifications" />
    <q-badge v-if="unreadCount > 0" color="red" floating transparent>
      {{ unreadCount }}
    </q-badge>
    <q-tooltip :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      {{tdc('Ver notificações')}}
    </q-tooltip>
  </s-btn>
</template>

<script >
import { defineComponent } from 'vue'
import { tdc } from '../../services/base'


export default defineComponent({
  components: {

  },
  setup () {
    
    return {
      
    }
  },
  data () {
    return {
      unreadCount: 3,
      tdc: tdc
    }
  },
  computed: {

  },

  mounted(){
   
  },

  methods: {
    verNotificacoes() {
     
    }
  }
})
</script>
<style scoped>
/* Estilos específicos do HeaderServices */
</style>
