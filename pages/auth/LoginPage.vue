<template>

  <q-page class="column">

    <s-card
      flat
      class="col row q-pa-md"
      :class="[
        $q.dark.isActive
          ? 'text-white'
          : 'text-dark',

        loginPositionClass
      ]"
      :style="loginBackgroundStyle"
    >

      <FormLogin />

    </s-card>

  </q-page>

</template>


<script setup>

import { computed } from 'vue'
import { useEntityStore } from 'quasar_resaas'
import FormLogin from './FormLogin.vue'

const Entity = useEntityStore()


// =========================================================
// POSITION
// =========================================================

const loginPositionClass = computed(() => {

  const position =
    Entity?.row?.login_position ||
    Entity?.login_position ||
    'center'

  const positions = {
    'top-left': 'items-start justify-start',
    'top-right': 'items-start justify-end',
    'center': 'items-center justify-center',
    'bottom-left': 'items-end justify-start',
    'bottom-right': 'items-end justify-end'
  }

  return positions[position] || positions.center

})


// =========================================================
// BACKGROUND
// =========================================================

const loginBackgroundStyle = computed(() => {

  const background =
    Entity?.row?.login_background ||
    Entity?.login_background

  // fallback
  if (!background) {
    return {
      background: $q.dark.isActive
        ? '#121212'
        : '#ffffff'
    }
  }

  // imagem
  if (
    background.startsWith('http://') ||
    background.startsWith('https://') ||
    background.startsWith('/')
  ) {
    return {
      backgroundImage: `url("${background}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  // cor ou gradient
  return {
    background
  }

})

</script>