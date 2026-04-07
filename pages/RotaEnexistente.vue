<template>
  <q-page class="flex flex-center bg-grey-1 q-pa-sm">
    <s-card class="welcome-card shadow-10">
      <q-card-section class="text-center">
        <div class="text-h4 q-mt-md text-weight-bold">
          {{ tdc('Rota Ainda Nao Foi Configurada no Front End') }}
        </div>

        <div class="text-subtitle1 text-grey-7 q-mt-sm">
          {{ tdc('Rota solicitada') }}: <b>{{ rota }}</b>
          <br>
           {{ tdc('Parametro') }}: <b>{{ id }}</b>
        </div>

        <div class="text-subtitle2 text-grey-6 q-mt-sm">
          {{ tdc('SaaS') }}
        </div>
      </q-card-section>
    </s-card>
  </q-page>
</template>
<script setup>
import { tdc } from '../boot/base'
import { useRoute } from 'vue-router'

const route = useRoute()
const rota = route.params.rota
const id = route.params.id
</script>>

<style scoped>
.welcome-card {
  width: 420px;
  max-width: 90%;
  border-radius: 20px;
  padding: 10px;
}
</style>

