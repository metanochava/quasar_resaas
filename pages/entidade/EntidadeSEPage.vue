<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { HTTPAuth, url } from '../../boot/api'

const router = useRouter()

// ---------------- STATE ----------------
const loading = ref(false)

const form = ref({
  nome: '',
  sucursal: '',
  email: '',
  telefone: ''
})

// ---------------- SUBMIT ----------------
async function submit() {
  try {
    loading.value = true

    const { data } = await HTTPAuth.post(url({type:"u", url:'/api/django_resaas/entidade/?selfRegist=self'}), form.value)

    Notify.create({
      type: 'positive',
      message: data?.message || 'Entidade criada com sucesso'
    })

    // 🔥 redirecionar para list ou detalhe
    router.push({ name: 'rh_entidade_view' })

  } catch (err) {
    Notify.create({
      type: 'negative',
      message: err?.response?.data?.detail || 'Erro ao criar entidade'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="q-pa-md">

    <div class="text-h5 q-mb-md">
      Criar Entidade
    </div>

    <q-card flat bordered class="q-pa-md">

      <q-form @submit.prevent="submit" class="q-gutter-md">

        <!-- 🔹 Nome -->
        <q-input
          v-model="form.nome"
          label="Nome da Entidade"
          outlined
          dense
          :rules="[val => !!val || 'Campo obrigatório']"
        />

        <!-- 🔹 Sucursal -->
        <q-input
          v-model="form.sucursal"
          label="Sucursal"
          outlined
          dense
          :rules="[val => !!val || 'Campo obrigatório']"
        />

        <!-- 🔹 Email -->
        <q-input
          v-model="form.email"
          label="Email"
          outlined
          dense
          type="email"
        />

        <!-- 🔹 Telefone -->
        <q-input
          v-model="form.telefone"
          label="Telefone"
          outlined
          dense
        />

        <!-- 🔥 BOTÕES -->
        <div class="row justify-end q-gutter-sm">

          <q-btn
            flat
            label="Cancelar"
            @click="router.back()"
          />

          <q-btn
            color="primary"
            label="Salvar"
            type="submit"
            :loading="loading"
          />

        </div>

      </q-form>

    </q-card>

  </div>
</template>