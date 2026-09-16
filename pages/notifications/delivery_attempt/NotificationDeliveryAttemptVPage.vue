<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="NotificationDeliveryAttempt.loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>
    <FormTwo
      v-else
      :store="NotificationDeliveryAttempt"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationDeliveryAttemptStore } from '../../../stores/NotificationDeliveryAttemptStore.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const NotificationDeliveryAttempt = useNotificationDeliveryAttemptStore()

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

    NotificationDeliveryAttempt.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(NotificationDeliveryAttempt.row?.id) === String(id)) {
    NotificationDeliveryAttempt.form = NotificationDeliveryAttempt.row
    return
  }

  NotificationDeliveryAttempt.row = await NotificationDeliveryAttempt.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await NotificationDeliveryAttempt.init()

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
