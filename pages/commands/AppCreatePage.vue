<template>
  <q-page class="q-pa-sm">

    <div class="text-h5 q-mb-lg">
      📦 Módulos
    </div>

    <div class="row q-col-gutter-lg">

      <!-- LEFT -->
      <div class="col-12">

        <div class="row q-col-gutter-md">

          <!-- CREATE -->
          <div class="col-12 col-md-3">
            <s-card bordered flat class="q-pa-lg">

              <div class="text-h6 q-mb-md">
                ➕ Criar Módulo
              </div>

              <s-input
                v-model="name"
                label="Name do módulo"
                outlined
                @keyup.enter="createApp"
              />

              <s-btn
                class="q-mt-md full-width"
                color="primary"
                icon="add"
                label="Criar"
                :loading="loading"
                @click="createApp"
              />

            </s-card>
          </div>

          <!-- LIST -->
          <div class="col-12 col-md-9 row q-col-gutter-sm">

            <div
              v-for="(app, index) in apps"
              :key="app.name + '_' + index"
              class="col-12 col-sm-3"
            >
              <s-card bordered flat class="app-card">

                <q-card-section class="row items-center">

                  <q-icon name="folder" size="28px" />

                  <div class="text-subtitle1 q-ml-sm">
                    {{ app.name }}
                  </div>

                  <q-space />

                  <q-badge color="primary">
                    {{ app.models || 0 }}
                  </q-badge>

                </q-card-section>

                <q-separator />

                <q-card-actions align="between">

                  <!-- OPEN -->
                  <s-btn
                    flat
                    color="primary"
                    icon="build"
                    label="Abrir"
                    @click="openScaffold(app.name)"
                  />

                  <!-- DELETE -->
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

// ---------------- STATE ----------------
const router = useRouter()


const name = ref('')
const loading = ref(false)
const apps = ref([])

// ---------------- LOAD ----------------
async function loadApps () {
  try {
    const { data } = await HTTPAuth.get('/api/django_resaas/resaas_apps/')
    apps.value = data?.apps || []
  } catch (e) {
    console.error(e)
  }
}

// ---------------- CREATE ----------------
async function createApp () {
  if (!name.value?.trim()) return

  loading.value = true
  const appName = name.value.trim()

  try {
    await HTTPAuth.post('/api/django_resaas/resaas_apps/', {
      name: appName
    }) 

    apps.value.push({ name: appName, models: 0 })
    name.value = ''
    const User = useUserStore()
    await User.getMenus()
    
  } catch (e) {
    loading.value = false
  } finally {
    loading.value = false
  }
}

// ---------------- DELETE ----------------
function confirmDelete(app) {
  Dialog.create({
    title: 'Confirmar',
    message: `Tem a certeza que deseja apagar o módulo "${app}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => deleteApp(app))
}

async function deleteApp(app) {
  const old = [...apps.value]

  // UI otimista
  apps.value = apps.value.filter(a => a.name !== app)

  try {
    await HTTPAuth.delete(`/api/django_resaas/resaas_apps/${app}/`)
    const User = useUserStore()
    await User.getMenus()

  } catch (e) {
    apps.value = old
  }
}

// ---------------- OPEN ----------------
function openScaffold(app) {
  router.push({
    name: 'view_scaffold',
    query: { app: app.toLowerCase() }
  })
}

// ---------------- INIT ----------------
onMounted(async () => {
  await loadApps()
})
</script>

<style scoped>
.app-card {
  transition: 0.2s;
}
.app-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}
</style>