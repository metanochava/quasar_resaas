<template>
  <div class="text-center col-md-6 col-sm-12">

    <!-- LOADING -->
    <div v-if="loading" class="q-pa-md">
      <q-spinner size="40px" />
    </div>

    <!-- LOGO -->
    <img
      v-else-if="User.Entidade?.logo?.url"
      :src="User.Entidade.logo.url"
      style="width:60%"
    />

    <!-- FALLBACK TIPO ENTIDADE -->
    <img
      v-else-if="User.TipoEntidade?.icon?.url"
      :src="User.TipoEntidade.icon.url"
      style="width:60%"
    />

    <!-- FALLBACK FINAL -->
    <img
      v-else
      src="https://placehold.co/400x300/png"
      style="width:60%"
    />

    

    <!-- NOME -->
    <!-- <br />
    <label
      v-if="User.Entidade?.nome"
      class="text-grey-6 text-h4"
    >
      {{ tdc(User.Entidade.nome) }}
    </label>

    <label
      v-else
      class="text-grey-6 text-h4"
    >
      {{ tdc(User.TipoEntidade?.nome) }}
    </label> -->

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { HTTPClient, url } from './../boot/api'
import { useUserStore } from './../stores/AuthStore'
import { tdc } from '../boot/base'


const User = useUserStore()
const route = useRoute()

const loading = ref(false)

/* =========================
   LOAD ENTIDADE
========================= */
async function loadEntidade(id) {
  if (!id) return

  loading.value = true

  try {
    const { data } = await HTTPClient.get(
      url({ type: 'u', url: 'saas/entidades/' + id, params:{} })
    )

    User.Entidade = data
  } catch (err) {
    console.error('Erro ao carregar entidade:', err)
  } finally {
    loading.value = false
  }
}

/* =========================
   AUTO LOAD ON MOUNT
========================= */
onMounted(() => {
  if (route.params.entidade_id) {
    loadEntidade(route.params.entidade_id)
  }
})

/* =========================
   AUTO RELOAD WHEN ROUTE CHANGES
========================= */
watch(
  () => route.params.entidade_id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadEntidade(newId)
    }
  }
)
</script>
