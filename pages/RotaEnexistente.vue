<template>
  <q-page class="flex flex-center bg-grey-1 q-pa-sm">
    <s-card class="welcome-card shadow-10">
      <q-card-section class="text-center">
        <div class="text-h4 q-mt-md text-weight-bold">
          {{ tdc('This Route Has Not Been Configured in the Front End Yet') }}
        </div>

        <div class="text-subtitle1 text-grey-7 q-mt-sm">
          {{ tdc('Requested route') }}: <b>{{ route }}</b>
          <br>
           {{ tdc('Parameter') }}: <b>{{ id }}</b>
        </div>

        <div class="text-subtitle2 text-grey-6 q-mt-sm">
          {{ tdc('SaaS') }}
        </div>
      </q-card-section>
    </s-card>
  </q-page>
</template>
<script setup>
import { tdc } from '../services/translation'
import { useRoute } from 'vue-router'

const route_ = useRoute()
const route = route_.params.route
const id = route_.params.id
</script>>

<style scoped>
.welcome-card {
  width: 420px;
  max-width: 90%;
  border-radius: 20px;
  padding: 10px;
}
</style>

