<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <FormTwo
      v-if="ready"
      :schema="Group.fields"
      :module="Group.app"
      :model="Group.model"
      :config="Group.config"
      :actions="Group.actions"
      :can-do="canDo"
      :ignore-fields="ignoreFields"
      :data="Group.form"
      @saved="onSaved"
      centerCol="col-4"
      rightCol="col-8"
    >

      <template #center v-if="Group.form?.id">
        <s-input label="Name" :modelValue="Group.form?.name"
        />
      </template>
      <template #right v-if="Group.form?.id">
        <PermissionManager
          :AllPermissions="permissions"
          :GroupPermissionsRe="Group.form.permissions"
          :Group="Group.form"
        />
      </template>

     
    </FormTwo>

    <div v-if="!ready" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupStore } from '../../stores/GroupStore'
import  PermissionManager  from './PermissionManager.vue'
import FormTwo from '../../components/auto/FormTwo.vue'
import { HTTPAuth, url } from '../../boot/api'



const permissions = ref([])
const groupPermissions = ref([])
const group = ref(null)


// ---------------- ROUTE ----------------
const route = useRoute()

// ---------------- STORE ----------------
const Group = useGroupStore()

// ---------------- STATE ----------------
const ready = ref(false)

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at',
  'permissions'
]

// ---------------- PERMISSIONS ----------------
function canDo(perm) {
  if (!perm) return true
  return true
}

// ---------------- LOAD DATA ----------------
async function load(id) {

  if (!id) {

    Group.resetForm?.()
    return
  }


  // 🔥 evita chamadas duplicadas com comparação segura
  if (String(Group.row?.id) === String(id)) {
    Group.form = Group.row 
    return
  }

  Group.row =  await Group.getById(id)
}

// ---------------- INIT ----------------
async function init() {
  try {
    ready.value = false

    await Group.init()

    const id = route.params.id
    await load(id)

    ready.value = true

     // 🔹 todas permissões
    const { data: all } = await HTTPAuth.get(
      url({ type: 'u', url: 'api/auth/permissions/' })
    )

    permissions.value = all
    console.log("meta",  permissions.value )

  } catch (err) {
    console.error('Erro ao inicializar página:', err)
  }

}

// ---------------- WATCH ROTA (CORRIGIDO) ----------------
watch(
  () => route.params,
  async (params) => {
    if (!params) return

    const id = params.id

    // 🔥 sempre carrega quando muda rota
    await load(id)
  },
  { immediate: false } // init já trata o primeiro carregamento
)

// ---------------- EVENTS ----------------
function onSaved(res) {
  // console.log('Salvo com sucesso', res)
}

// ---------------- LIFECYCLE ----------------
onMounted(init)
</script>