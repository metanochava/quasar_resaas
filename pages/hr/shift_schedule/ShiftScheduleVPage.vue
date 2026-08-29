<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="ShiftSchedule.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="ShiftSchedule"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    />

  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShiftScheduleStore } from '../../../stores/ShiftScheduleStore'
import FormTwo from '../../../components/auto/FormTwo.vue'

// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const ShiftSchedule = useShiftScheduleStore()

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

// ---------------- PERMISSIONS ----------------
function canDo(perm) {
  if (!perm) return true
  return true
}

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    ShiftSchedule.resetForm?.()
    return
  }


  // avoids duplicate calls with a safe comparison
  if (String(ShiftSchedule.row?.id) === String(id)) {
    ShiftSchedule.form = ShiftSchedule.row
    return
  }

  ShiftSchedule.row = await ShiftSchedule.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await ShiftSchedule.init()

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