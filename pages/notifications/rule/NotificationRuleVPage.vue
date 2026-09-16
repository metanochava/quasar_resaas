<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="NotificationRule.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>
    <FormTwo
      v-else
      :store="NotificationRule"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationRuleStore } from '../../../stores/NotificationRuleStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const NotificationRule = useNotificationRuleStore()

// ---------------- STATE ----------------
const ready = ref(false)

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    NotificationRule.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(NotificationRule.row?.id) === String(id)) {
    NotificationRule.form = NotificationRule.row
    return
  }

  NotificationRule.row = await NotificationRule.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await NotificationRule.init()

    const id = route.params.id
    await load(id)

    ready.value = true

  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

// ---------------- WATCH ROUTE (FIXED) ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    // always reloads when the route changes
    await load(id)
  },
  { immediate: false } // init already handles the first load
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // console.log('Saved successfully', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>
