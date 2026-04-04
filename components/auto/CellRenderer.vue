<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  value: null,
  col: Object,
  row: Object
})

const showPreview = ref(false)

// tentar parse JSON
const parsed = computed(() => {
  try {
    return typeof props.value === 'string'
      ? JSON.parse(props.value)
      : props.value
  } catch {
    return null
  }
})

// 🖼️ imagem
const isImage = computed(() => parsed.value?.url)
const imageUrl = computed(() => parsed.value?.url || '')

// 🔘 boolean
const isBoolean = computed(() => typeof props.value === 'boolean')

// abrir modal
function openPreview() {
  showPreview.value = true
}
</script>

<template>
  <!-- 🖼️ IMAGEM -->
  <template v-if="isImage">
    <img
      :src="imageUrl"
      style="width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer"
      @click="openPreview"
    />

    <q-dialog v-model="showPreview">
      <q-card>
        <img :src="imageUrl" style="max-width:100%;max-height:80vh" />
      </q-card>
    </q-dialog>
  </template>

  <!-- 🔘 BOOLEAN -->
  <template v-else-if="isBoolean">
    <s-btn
      dense
      size="sm"
      :color="value ? 'positive' : 'negative'"
      :label="value ? 'Sim' : 'Não'"
    />
  </template>

  <!-- 🔤 DEFAULT -->
  <template v-else>
    {{ value }}
  </template>
</template>