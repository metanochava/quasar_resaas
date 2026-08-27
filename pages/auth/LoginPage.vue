<template>

  <q-page class="column">

    <s-card
      flat
      class="col row q-pa-md"
      :class="[
        $q.dark.isActive
          ? 'bg-dark text-white'
          : 'bg-saas',

        loginPositionClass
      ]"
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
// LOGIN POSITION
// =========================================================

const loginPositionClass = computed(() => {

  const position =
    Entity?.row?.login_position ||
    Entity?.login_position ||
    'bottom-right'

  const positions = {

    'top-left':
      'items-start justify-start',

    'top-right':
      'items-start justify-end',

    'center':
      'items-center justify-center',

    'bottom-left':
      'items-end justify-start',

    'bottom-right':
      'items-end justify-end'

  }

  return (
    positions[position] ||
    positions.center
  )

})

// top-left
// top-right
// center
// bottom-left
// bottom-right

</script>