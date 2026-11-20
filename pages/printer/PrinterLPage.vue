<template>
  <q-page class="q-pa-sm">
    <!-- the current Branch's printers: their paper and the documents each
         prints by default (core/printing) -->
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
const model = ref('Printer')
// the entity and branch are the request's context, never chosen here
const ignore = ['created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'state', 'entity', 'branch', 'documents']
</script>
