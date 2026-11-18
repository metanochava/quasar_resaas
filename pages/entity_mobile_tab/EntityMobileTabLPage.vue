<template>
  <q-page class="q-pa-sm">
    <!-- the current Entity's own phone bottom tabs (its Admin's): when any is
         active they replace the Entity Type's -->
    <AutoCrud
      :app="app" :model="model" :can="User.can"
      :ignoreFields="ignore" :ignoreFieldsFilter="ignore"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import AutoCrud from '../../components/auto/AutoCrud.vue'
import { useUserStore } from '../../stores/UserStore'

const User = useUserStore()
const app = ref('django_resaas')
const model = ref('EntityMobileTab')
// the entity is the request's context, never chosen here
const ignore = ['created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'state', 'entity']
</script>
