<template>
  <q-page class="q-pa-md">

    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ tdc('Modules') }}</div>
        <div class="text-caption modules-subtitle">
          {{ tdc('Scaffold new backend/frontend modules and manage which entity types use them.') }}
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">

      <!-- CREATE -->
      <div class="col-12 col-md-4 col-lg-3">
        <s-card bordered flat class="q-pa-lg create-card">

          <FormSection title="Create Module" icon="add_circle">
            <div class="col-12">
              <s-input
                v-model="name"
                :label="tdc('Module name')"
                :hint="tdc('Letters, numbers and underscore only')"
                @keyup.enter="createApp"
              />

              <div v-if="hasStrippedChars" class="text-caption stripped-warning q-mt-sm">
                <q-icon name="warning" size="16px" class="q-mr-xs" />
                {{ tdc('A dot does not create a sub-folder - it will be removed. The folder created will be:') }}
                <strong>{{ cleanedName || '—' }}</strong>
              </div>
            </div>

            <div class="col-12">
              <s-btn
                class="full-width q-mt-md"
                color="primary"
                icon="add"
                :label="tdc('Create')"
                :loading="loading"
                :disable="!cleanedName"
                @click="createApp"
              />
            </div>
          </FormSection>

        </s-card>
      </div>

      <!-- LIST -->
      <div class="col-12 col-md-8 col-lg-9">
        <div class="row q-col-gutter-md">

          <div
            v-for="app in apps"
            :key="app.name"
            class="col-12 col-sm-6 col-lg-4"
          >
            <s-card bordered flat class="app-card column">

              <q-card-section class="row items-center no-wrap">
                <q-avatar color="primary" text-color="white" icon="folder" />

                <div class="q-ml-sm col ellipsis">
                  <div class="text-subtitle1 text-weight-medium ellipsis">{{ app.name }}</div>
                  <div class="text-caption app-models-count">
                    {{ app.models || 0 }} {{ tdc(app.models === 1 ? 'model' : 'models') }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="col row q-gutter-xs items-start content-start">
                <s-btn
                  flat dense
                  icon="table_chart"
                  :label="tdc('Models')"
                  @click="openModels(app)"
                />
                <s-btn
                  flat dense
                  icon="category"
                  :label="tdc('Entity Types')"
                  :disable="!appIdByName[app.name.toLowerCase()]"
                  @click="openEntityTypes(app)"
                >
                  <q-tooltip v-if="!appIdByName[app.name.toLowerCase()]">
                    {{ tdc('This module has no registry entry yet') }}
                  </q-tooltip>
                </s-btn>
              </q-card-section>

              <q-separator />

              <q-card-actions align="between">
                <s-btn
                  flat
                  color="secondary"
                  icon="build"
                  :label="tdc('Open')"
                  @click="openScaffold(app.name)"
                />

                <s-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="confirmDelete(app.name)"
                >
                  <q-tooltip>{{ tdc('Delete') }}</q-tooltip>
                </s-btn>
              </q-card-actions>

            </s-card>
          </div>

          <div v-if="!apps.length" class="col-12">
            <div class="text-center text-grey q-pa-xl">
              {{ tdc('No modules yet - create the first one on the left.') }}
            </div>
          </div>

        </div>
      </div>

    </div>

    <AppModelsDialog v-model="modelsOpen" :app-name="activeApp?.name" />

    <AppEntityTypesDialog
      v-model="entityTypesOpen"
      :app-id="activeApp ? appIdByName[activeApp.name.toLowerCase()] : null"
      :app-name="activeApp?.name"
    />

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Dialog } from 'quasar'
import { useRouter } from 'vue-router'
import { HTTPAuth, url } from '../../services/api'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import FormSection from '../../components/auto/FormSection.vue'
import AppModelsDialog from './AppModelsDialog.vue'
import AppEntityTypesDialog from './AppEntityTypesDialog.vue'

// ---------------- STATE ----------------
const router = useRouter()

const name = ref('')
const loading = ref(false)
const apps = ref([])

// name (lowercase) -> real App.id (UUID) - a lista "resaasapps" só
// devolve {name, models}, sem id; o registo real de App (com id) vem
// de django_resaas/apps/ (AppAPIView, já existente e usado por
// EntityTypeStore.loadApps()). Um módulo pode não ter ainda uma linha
// App (ex.: adicionado a MY_APPS manualmente, nunca criado por aqui) -
// nesse caso o botão "Entity Types" fica desactivado (ver template).
const appIdByName = ref({})

const activeApp = ref(null)
const modelsOpen = ref(false)
const entityTypesOpen = ref(false)

// ---------------- DOT/SUB-FOLDER PREVIEW ----------------
// Mesma limpeza que o backend aplica de facto (AppScaffoldService.
// clean(), re.sub(r"[^a-zA-Z0-9_]", "", value)) - reflectida aqui só
// para o utilizador ver ANTES de criar o que vai realmente acontecer.
// Não existe sub-pasta real: um ponto (ou qualquer outro carácter fora
// de [a-zA-Z0-9_]) é simplesmente removido, nunca interpretado como
// separador de caminho - a lógica do backend não foi alterada.
const cleanedName = computed(() => name.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
const hasStrippedChars = computed(() => cleanedName.value !== name.value.toLowerCase() && !!name.value)

// ---------------- LOAD ----------------
async function loadApps () {
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} }))
    apps.value = data?.apps || []
  } catch (e) {
    console.error(e)
  }
}

async function loadAppRegistry () {
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/apps/', params: {} }))
    const map = {}
    for (const row of data || []) {
      map[(row.name || '').toLowerCase()] = row.id
    }
    appIdByName.value = map
  } catch (e) {
    console.error(e)
  }
}

// ---------------- CREATE ----------------
async function createApp () {
  if (!cleanedName.value) return

  loading.value = true
  const appName = name.value.trim()

  try {
    await HTTPAuth.post(url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} }), {
      name: appName
    })

    apps.value.push({ name: cleanedName.value, models: 0 })
    name.value = ''
    await loadAppRegistry()

    const User = useUserStore()
    await User.getMenus()

  } finally {
    loading.value = false
  }
}

// ---------------- DELETE ----------------
function confirmDelete(app) {
  Dialog.create({
    title: tdc('Confirm'),
    message: tdc('Are you sure you want to delete the module "{name}"?').replace('{name}', app),
    cancel: true,
    persistent: true
  }).onOk(() => deleteApp(app))
}

async function deleteApp(app) {
  const old = [...apps.value]

  // optimistic UI
  apps.value = apps.value.filter(a => a.name !== app)

  try {
    await HTTPAuth.delete(url({ type: 'u', url: `django_resaas/resaasapps/${app}/`, params: {} }))
    const User = useUserStore()
    await User.getMenus()

  } catch (e) {
    apps.value = old
  }
}

// ---------------- MODELS MODAL ----------------
function openModels(app) {
  activeApp.value = app
  modelsOpen.value = true
}

// ---------------- ENTITY TYPES MODAL ----------------
function openEntityTypes(app) {
  activeApp.value = app
  entityTypesOpen.value = true
}

// ---------------- OPEN SCAFFOLD ----------------
function openScaffold(app) {
  router.push({
    name: 'view_scaffold',
    query: { app: app.toLowerCase() }
  })
}

// ---------------- INIT ----------------
onMounted(async () => {
  await Promise.all([loadApps(), loadAppRegistry()])
})
</script>

<style scoped>
.modules-subtitle {
  opacity: 0.65;
  margin-top: 2px;
}

.create-card {
  height: 100%;
}

.stripped-warning {
  color: var(--q-warning, #f2c037);
}

.app-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.app-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.app-models-count {
  opacity: 0.6;
}
</style>
