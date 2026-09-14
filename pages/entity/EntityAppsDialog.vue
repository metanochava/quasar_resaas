<script setup>
import { ref, computed, watch } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'

// Apps activas para esta Entity (EntityApp) - só entre as que já
// fazem parte do seu EntityType (EntityTypeApp), nunca o registo
// global de Apps (esse universo é escolhido ao nível do EntityType -
// ver pages/entity_type/AppManager.vue/EntityTypeStore.apps - aqui só
// se escolhe dentro do que o EntityType já disponibiliza). Backend
// valida o mesmo (EntityAPIView.addApp rejeita 400 fora do
// EntityTypeApp), este ecrã só reflecte essa regra.
//
// Mesmo layout/estrutura de AppManager.vue (entity_type) - card
// full-height com header fixo, pesquisa fixa, lista com scroll - o
// próprio <q-dialog persistent full-height full-width> fica na
// página que usa este componente, não aqui (mesma divisão de
// responsabilidade de AppManager.vue/EntityTypeSEPage.vue).
const props = defineProps({
  entityId: { type: [String, Number], default: null },
  entityTypeId: { type: [String, Number], default: null },
})

const loading = ref(false)
const toggling = ref(null)
const search = ref('')

const available = ref([])
const linked = ref([])

const hasApp = computed(() => (id) => linked.value.some(a => String(a.id) === String(id)))

const filteredApps = computed(() => {
  const s = search.value.toLowerCase().trim()
  if (!s) return available.value
  return available.value.filter(a => (a.name || '').toLowerCase().includes(s))
})

async function load() {
  if (!props.entityId || !props.entityTypeId) return

  loading.value = true

  try {
    const [entityTypeApps, entityApps] = await Promise.all([
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitytypes/${props.entityTypeId}/apps/` })),
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/entitys/${props.entityId}/apps/` })),
    ])

    available.value = entityTypeApps.data || []
    linked.value = entityApps.data || []
  } finally {
    loading.value = false
  }
}

async function toggleApp(app) {
  toggling.value = app.id
  const wasLinked = hasApp.value(app.id)
  const old = [...linked.value]

  // optimistic UI
  linked.value = wasLinked
    ? linked.value.filter(a => String(a.id) !== String(app.id))
    : [...linked.value, { id: app.id, name: app.name }]

  try {
    await HTTPAuth.post(
      url({
        type: 'u',
        url: `django_resaas/entitys/${props.entityId}/${wasLinked ? 'removeApp' : 'addApp'}/`,
      }),
      { id: app.id }
    )
  } catch (e) {
    linked.value = old
  } finally {
    toggling.value = null
  }
}

watch(() => [props.entityId, props.entityTypeId], load, { immediate: true })
</script>

<template>
  <s-card class="column full-height">

    <!-- ================= FIXED HEADER ================= -->
    <q-bar class="row items-center" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'">
      <div class="text-h6">
        {{ tdc('Apps Management') }}
      </div>

      <q-space />

      <q-badge color="white" text-color="primary">
        {{ linked.length }} {{ tdc('active') }}
      </q-badge>

      <s-btn dense flat icon="close" v-close-popup>
        <s-tooltip>{{ tdc('Close') }}</s-tooltip>
      </s-btn>
    </q-bar>

    <q-separator />

    <!-- ================= FIXED SEARCH ================= -->
    <q-card-section>
      <q-input
        v-model="search"
        outlined
        dense
        clearable
        :label="tdc('Search')"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <!-- ================= SCROLL (HERE ONLY) ================= -->
    <q-card-section class="col scroll">

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" />
      </div>

      <q-list v-else separator bordered>
        <q-item
          v-for="app in filteredApps" :key="app.id"
          clickable
          v-ripple
          class="app-item"
          :class="{ 'app-active': hasApp(app.id) }"
          @click="toggleApp(app)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="hasApp(app.id) ? 'primary' : 'grey-4'"
              :text-color="hasApp(app.id) ? 'white' : 'dark'"
              icon="extension"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ app.name }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-chip dense size="sm" :color="hasApp(app.id) ? 'primary' : 'grey-5'" text-color="white">
                {{ hasApp(app.id) ? tdc('Active') : tdc('Inactive') }}
              </q-chip>
              <q-checkbox
                :model-value="hasApp(app.id)"
                :disable="toggling === app.id"
                @click.stop
                @update:model-value="() => toggleApp(app)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="!loading && !filteredApps.length" class="text-center text-grey q-pa-md">
        {{ tdc("This entity's EntityType has no apps yet") }}
      </div>

    </q-card-section>

  </s-card>
</template>

<style scoped>
.app-item {
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.app-active {
  background: rgba(25, 118, 210, 0.08);
  border-left-color: var(--q-primary);
}
</style>
