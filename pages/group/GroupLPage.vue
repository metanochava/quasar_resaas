
<template>
  <q-page class="full-height ">
    <AutoCrud 
      :module="module" :model="model" :can="User.can" route="view_paciente"  
      :ignoreFields="['created_at','updated_at', 'created_by', 'updated_by', 'deleted_at']" 
    />
  </q-page>
</template>

<script setup>

import  AutoCrud  from './../../components/auto/AutoCrud.vue'
import { useUserStore } from './../../stores/UserStore'
import { ref, onMounted} from 'vue'


const User =useUserStore()
const module = ref('django_resaas')
const model = ref('Group')

onMounted(async () => {

})
</script>
