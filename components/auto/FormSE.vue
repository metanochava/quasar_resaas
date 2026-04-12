<script setup>
import FormEngine from 'components/FormEngine.vue'

const props = defineProps({
  schema: Array,
  data: Object,
  module: String,
  model: String
})
</script>

<template>
  <div class="q-pa-md">

    <div class="text-h6 q-mb-md">
      {{ data?.id ? 'Editar' : 'Novo' }}
    </div>

    <FormEngine
      v-bind="props"
      @saved="$router.back()"
    />

  </div>
</template>