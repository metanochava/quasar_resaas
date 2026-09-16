<template>
  <s-card flat class="entity-type-panel">
    <div
      class="panel-header"
      :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
    >
      <q-icon name="business" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Entities') }}
      </div>
      <q-space />
      <q-badge color="white" text-color="primary" class="q-px-sm q-mr-sm">
        {{ entities.length }}
      </q-badge>
      <s-btn
        v-if="entities.length"
        round
        dense
        flat
        color="white"
        icon="map"
        @click="showMap = true"
      >
        <s-tooltip>{{ tdc('Show all branches of this entity type on the map') }}</s-tooltip>
      </s-btn>
    </div>

    <BranchesMapDialog
      v-model="showMap"
      :title="tdc('Branches')"
      :fetch-url="`${EntityType.safeUrl}/${entityTypeId}/branches_map/`"
    />

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <q-list v-else-if="entities.length" separator>
      <q-item
        v-for="entity in entities"
        :key="entity.id"
        clickable
        @click="goToEntity(entity.id)"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="36px">
            <q-icon name="business" size="18px" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ entity.name }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <s-btn
            round
            dense
            flat
            color="primary"
            icon="edit"
            @click.stop="goToEntity(entity.id)"
          >
            <s-tooltip>{{ tdc('Edit entity') }}</s-tooltip>
          </s-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-center text-caption text-grey q-pa-lg">
      <q-icon name="business" size="32px" class="q-mb-xs" />
      <div>{{ tdc('No entities yet.') }}</div>
    </div>
  </s-card>
</template>


<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'
import BranchesMapDialog from '../../components/address/BranchesMapDialog.vue'

const props = defineProps({
  entityTypeId: [String, Number]
})

const router = useRouter()
const EntityType = useEntityTypeStore()

const entities = ref([])
const loading = ref(false)
const showMap = ref(false)

async function load() {
  if (!props.entityTypeId) {
    entities.value = []
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `${EntityType.safeUrl}/${props.entityTypeId}/entitys/` })
    )
    entities.value = data || []
  } finally {
    loading.value = false
  }
}

function goToEntity(id) {
  router.push({ name: 'change_entity', params: { id } })
}

watch(() => props.entityTypeId, load)
onMounted(load)
</script>


<style scoped>
.entity-type-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}
</style>
