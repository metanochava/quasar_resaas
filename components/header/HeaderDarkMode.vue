<template>
  <s-btn
    dense flat round
    :icon="$q.dark.isActive ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
    @click="toggleDark"
  >
    <q-tooltip
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'"
    >
      {{ $q.dark.isActive ? tdc('Clique para modo dia') : tdc('Clique para modo noite') }}
    </q-tooltip>
  </s-btn>
</template>


<script>
  import { defineComponent } from 'vue'
  import { tdc } from '../../services/translation'
  import { getStorage, setStorage } from '../../services/storage'

  export default defineComponent({
    name: 'HeaderDarkMode',
    data () {
      return {
        tdc: tdc
      }
    },
    mounted() {
      const isDark = ( getStorage('l', 'dark'))?.toLowerCase() === 'true'
      this.$q.dark.set(isDark) 
    },
    methods: {
      toggleDark () {
        const newValue = !this.$q.dark.isActive
        this.$q.dark.set(newValue)
        setStorage('l', 'dark', newValue)
      }
    }
  })
</script>
