<template>
  <q-page class="q-pa-md">

    <!-- LOADING -->
    <div v-if="store.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>

    <!-- ERROR -->
    <q-banner v-else-if="errors" class="bg-red text-white q-mb-md">
      <div>{{ errors }}</div>
    </q-banner>

    <!-- FORM -->
    <FormTwo
      v-else
      :store="store"
      :ignore-fields="ignoreFields"
      :external-save="true"
      @save="save"
    >

      <!-- 🔌 SLOT HEADER -->
      <template #header>
        <slot name="header" />
      </template>

      <!-- 🔌 SLOT LEFT -->
      <template #left>
        <slot name="left" />
      </template>

      <!-- 🔌 SLOT CENTER -->
      <template #center>
        <slot name="center" />
      </template>

      <!-- 🔌 SLOT RIGHT -->
      <template #right>
        <slot name="right" />
      </template>

      <!-- 🔌 SLOT FOOTER -->
      <template #footer>
        <slot name="footer" />
      </template>

    </FormTwo>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormTwo from './FormTwo.vue' // 👈 teu componente atual

const props = defineProps({
  store: { type: Object, required: true },
  id: { type: [String, Number], default: null },
  autoLoad: { type: Boolean, default: true },
  ignoreFields: { type: Array, default: [ ]}
})

const route = useRoute()
const router = useRouter()

const store = props.store

// 🔥 state
const loading = ref(true)
const saving = ref(false)
const errors = ref(null)

// 🔑 id dinâmico
const recordId = computed(() => props.id || route.params.id)

// 📦 dados do store (já padrão teu)
const schema = computed(() => store.fields)
const form = computed(() => store.form)
const config = computed(() => store.config)
const actions = computed(() => store.actions)

// 🔐 permissões
const canDo = (action) => {
  if (!store.canDo) return true
  return store.canDo(action)
}

// ========================
// 🚀 LOAD INTELIGENTE
// ========================
const load = async () => {
  loading.value = true
  errors.value = null

  try {
    // 🔥 INIT (schema + list)
    await store.init()

    // 🔥 modo edição
    if (recordId.value) {
      await store.getById(recordId.value)
    } else {
      store.resetForm()
    }

  } catch (e) {
    errors.value = e
  } finally {
    loading.value = false
  }
}

// ========================
// 💾 SAVE (USA STORE CORE)
// ========================
const save = async () => {
  saving.value = true
  errors.value = null

  try {
    const res = await store.save()

    // 🔥 redirect opcional
    if (config.value?.redirectOnSave) {
      router.push(config.value.redirectOnSave)
    } else {
      router.back()
    }

  } catch (e) {
    errors.value = e?.response?.data || e
  } finally {
    saving.value = false
  }
}

// ========================
// ❌ ERROR HANDLER
// ========================
const onError = (err) => {
  errors.value = err
}

// lifecycle
onMounted(() => {
  if (props.autoLoad) load()
})
</script>


