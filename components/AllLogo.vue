<template>
  <div class="text-center col-md-6 col-sm-12">

    <!-- LOADING -->
    <div v-if="loading" class="q-pa-md">
      <q-spinner size="40px" />
    </div>

    <!-- LOGO -->
    <img
      v-else-if="User.Entity?.logo?.url"
      :src="User.Entity.logo.url"
      style="width:60%"
    />

    <!-- FALLBACK TIPO ENTIDADE -->
    <img
      v-else-if="User.EntityType?.icon?.url"
      :src="User.EntityType.icon.url"
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
      v-if="User.Entity?.nome"
      class="text-grey-6 text-h4"
    >
      {{ tdc(User.Entity.nome) }}
    </label>

    <label
      v-else
      class="text-grey-6 text-h4"
    >
      {{ tdc(User.EntityType?.nome) }}
    </label> -->

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { HTTPClient, url } from './../boot/api'
import { useUserStore } from './../stores/UserStore'
import { tdc } from '../boot/base'


const User = useUserStore()
const route = useRoute()

const loading = ref(false)

/* =========================
   LOAD ENTIDADE
========================= */
async function loadEntity(id) {
  if (!id) return

  loading.value = true

  try {
    const { data } = await HTTPClient.get(
      url({ type: 'u', url: 'saas/entitys/' + id, params:{} })
    )

    User.Entity = data
  } catch (err) {
    console.error('Erro ao carregar entity:', err)
  } finally {
    loading.value = false
  }
}

/* =========================
   AUTO LOAD ON MOUNT
========================= */
onMounted(() => {
  if (route.params.entity_id) {
    loadEntity(route.params.entity_id)
  }
})

/* =========================
   AUTO RELOAD WHEN ROUTE CHANGES
========================= */
watch(
  () => route.params.entity_id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadEntity(newId)
    }
  }
)
</script>
