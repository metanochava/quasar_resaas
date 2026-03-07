<template>
  <div class="row items-center no-wrap q-gutter-sm">
    <q-avatar size="40px">
      <img   v-if="User.Entidade" :src="User?.Entidade?.logo?.url" />
      <img   v-else :src="User.TipoEntidade?.icon?.url" />
    </q-avatar>

    <div class="text-h6 text-weight-medium">
      <label v-if="User?.Entidade">
        {{ tdc(User?.Entidade?.nome) }}

        <q-tooltip
          v-if="User?.Sucursal?.nome"
          :class="$q.dark.isActive
            ? 'bg-dark text-white text-subtitle1'
            : 'bg-primary text-white text-subtitle1'"
        >
          {{ tdc(User?.Sucursal?.nome) }}
        </q-tooltip>
      </label>
      <label v-else >{{tdc( User.TipoEntidade?.nome )}}</label>
    </div>
  </div>
</template>

<script>

import { defineComponent } from 'vue'
import { TipoEntidadeStore, UserStore } from '../../stores/TipoEntidadeStore'
import { tdc } from '../../boot/base';


export default defineComponent({
  components: {

  },
  setup () {
    const Auth = TipoEntidadeStore()
    const User = UserStore()
    return {
      Auth,
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
    
  
  }
})
</script>
