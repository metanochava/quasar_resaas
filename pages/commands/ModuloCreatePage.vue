<template>
  <q-page class=" q-pa-sm">
    <div class="text-h5 q-mb-lg">
      📦 Módulos
    </div>

    <div class="row q-col-gutter-lg">

      <!-- ================================= -->
      <!-- LEFT: CARDS DE MÓDULOS -->
      <!-- ================================= -->
      <div class="col-12 col-md-12">

        <div class="row q-col-gutter-md">
          <!-- ================================= -->
          <!-- RIGHT: CRIAR -->
          <!-- ================================= -->
          <div class="col-12 col-md-3">
            <s-card bordered flat class="q-pa-lg">
              <div class="text-h6 q-mb-md">
                ➕ Criar Módulo
              </div>

              <s-input
                v-model="name"
                label="Nome do módulo"
                outlined
                @keyup.enter="createModule"
              />

              <s-btn
                class="q-mt-md full-width"
                color="primary"
                icon="add"
                label="Criar"
                :loading="loading"
                @click="createModule"
              />
            </s-card>
          </div>

          <div class="col-12 col-md-9 row q-col-gutter-sm">
            <div
              v-for="app in apps"
              :key="app.name"
              class="col-12 col-sm-3"
            >
              <s-card bordered flat class="module-card">

                <q-card-section class="row items-center">

                  <q-icon name="folder" size="28px" />

                  <div class="text-subtitle1 q-ml-sm">
                    {{ app.name }}
                  </div>

                  <q-space />

                  <!-- badge models -->
                  <q-badge color="primary">
                    {{ app.models }}
                  </q-badge>

                </q-card-section>

                <q-separator />

                <q-card-actions align="between">

                  <!-- abrir scaffold -->
                  <s-btn
                    flat
                    color="primary"
                    icon="build"
                    label="Abrir"
                    @click="openScaffold(app.name)"
                  />

                  <!-- apagar -->
                  <s-btn
                    flat
                    round
                    color="negative"
                    icon="delete"
                    @click="confirmDelete(app.name)"
                  />

                </q-card-actions>
              </s-card>
            </div>
          </div>
          
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Notify, Dialog } from 'quasar'
import { useRouter } from 'vue-router'
import { HTTPAuth } from '../../boot/api'
import { useUserStore } from '../../stores/UserStore'

// ----------------------------------

const router = useRouter()

const name = ref('')
const loading = ref(false)
const apps = ref([])

const User = useUserStore()

// ----------------------------------
// LOAD
// ----------------------------------

async function loadApps () {
  const { data } = await HTTPAuth.get('api/django_resaas/resaas_modulos/')
  apps.value = data.apps
}

// ----------------------------------
// CREATE
// ----------------------------------

async function createModule () {
  if (!name.value?.trim()) return

  loading.value = true
  const moduleName = name.value.trim()

  apps.value.push({name: moduleName, models: 0})
  name.value = ''

  try {
    await HTTPAuth.post('api/django_resaas/resaas_modulos/', { name: moduleName })
  } catch (e) {
    // rollback
    apps.value = apps.value.filter(a => a.name !== moduleName)
    User.getMenus()
    console.error(e)
  } finally {
    loading.value = false
  }
}


// ----------------------------------
// DELETE
// ----------------------------------

function confirmDelete(app) {

  Dialog.create({
    title: 'Confirmar',
    message: `Tem a certeza que deseja apagar o módulo "${app}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => deleteModule(app))
}

async function deleteModule(app) {
  const old = [...apps.value]

  apps.value = apps.value.filter(a => a.name !== app)

  try {
    await HTTPAuth.delete(`api/django_resaas/resaas_modulos/${app}/`)
    User.getMenus()
  } catch (e) {
    apps.value = old
  }
}


// ----------------------------------
// OPEN SCAFFOLD
// ----------------------------------

function openScaffold(app) {
  router.push({ name: 'view_scaffold', query: {modulo: app } })
}

// ----------------------------------

onMounted(loadApps)
</script>

<style scoped>
.module-card {
  transition: 0.2s;
}
.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}
</style>
