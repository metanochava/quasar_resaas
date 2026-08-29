
<template>
  <q-page class="q-pa-sm">
    <AutoCrud 
      :app="app" :model="model" :can="User.can"  
      :ignoreFields="['created_at','updated_at', 'created_by', 'updated_by', 'deleted_at']" 
    />
  </q-page>
</template>

<script setup>

import  AutoCrud  from './../../components/auto/AutoCrud.vue'
import { useUserStore } from './../../stores/UserStore'
import { ref, onMounted} from 'vue'


const User =useUserStore()
const app = ref('auth')
const model = ref('Group')

onMounted(async () => {

})
</script>
