<template>
  
  <q-page class="q-pa-sm">


    <q-dialog v-model="openGroups" persistent full-height full-width>
      <GroupManager  :userId="Employee.form?.person_data?.user?.id" />
    </q-dialog>

    <!-- FORM -->
    <div v-if="Employee?.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <FormTwo
      v-else
      :store="Employee"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      @saved="onSaved"
    >

      <template #right v-if="Employee.form?.id">
          <s-card class="q-pa-0 q-gutter-sm " flat>
            <s-btn @click="openGroups = !openGroups" label="Groups" color="primary" class="full-width" />
          </s-card>
        </template>

        <template #footer v-if="Employee.form?.id">
          
        </template>

    </FormTwo>
 
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import FormTwo from '../../components/auto/FormTwo.vue'
// import { useEntityStore } from '../../stores/EntityStore'
import GroupManager from '../hr/group/GroupManagerUser.vue'




// ---------------- STORE ----------------
// const Entity = useEntityStore()
const route = useRoute()
const Employee = useEmployeeStore()

// ---------------- STATE ----------------
const ready = ref(false)
const openGroups = ref(false)
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

    Employee.resetForm?.()
    return
  }

  // 🔥 avoids duplicate calls with a safe comparison
  if (String(Employee.row?.id) === String(id)) {
    Employee.form = Employee.row 
    return
  }

  Employee.row =  await Employee.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Employee.init()

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

    // 🔥 always reloads when the route changes
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