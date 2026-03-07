<template>
  <q-page class="flex flex-center bg-grey-1 q-pa-sm">
    <q-card class="welcome-card shadow-10">
      <q-card-section class="text-center">
         <AllLogo />
        <div class="text-h4 q-mt-md text-weight-bold"> {{ tdc('Welcome to') }} {{ tdc(User.TipoEntidade?.nome) }} {{ tdc('SaaS') }}</div>

        <div class="text-subtitle1 text-grey-7 q-mt-sm">
          {{  tdc('Plataforma inteligente para gestão empresarial moderna') }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center">
        <q-btn
          color="primary"
          :label="tdc('Entrar no Sistema')"
          icon="login"
          class="q-px-lg"
          @click="$router.push('/login')"
        />

        <q-btn flat color="secondary" :label="tdc('Criar Conta')" class="q-ml-md" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
  import { tdc } from '../boot/base';
  import { UserStore } from '../stores/TipoEntidadeStore';
  import AllLogo from './../components/AllLogo.vue';
  const User = UserStore()
</script>

<style scoped>
.welcome-card {
  width: 420px;
  max-width: 90%;
  border-radius: 20px;
  padding: 10px;
}
</style>

