<template>

  <q-card
    flat
    bordered
    class="rounded-borders cursor-pointer"
    @click="$emit('select', person)"
  >

    <q-card-section class="row items-center no-wrap">

      <!-- AVATAR -->
      <q-avatar
        color="primary"
        text-color="white"
        size="50px"
      >

        <q-img v-if="person.profile" :src="person.profile?.url" />
        <label v-else>{{ initials }}</label>
        

      </q-avatar>

      <!-- INFO -->
      <div class="q-ml-md col">

        <div class="text-subtitle1 text-weight-medium">
{{ person }}
          {{ person.full_name }}

        </div>

        <div class="text-caption text-grey">

          {{ person.phone }}

        </div>

        <div class="text-caption text-grey">

          {{ person.email }}

        </div>

      </div>

      <!-- ACTION -->
      <q-btn
        flat
        round
        dense
        icon="chevron_right"
      />

    </q-card-section>

  </q-card>

</template>

<script setup>

import { computed } from 'vue'

const props = defineProps({
  person: {
    type: Object,
    required: true
  }
})

defineEmits(['select'])

const initials = computed(() => {

  return (props.person?.full_name || '')
    .split(' ')
    .map(i => i[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
})

</script>