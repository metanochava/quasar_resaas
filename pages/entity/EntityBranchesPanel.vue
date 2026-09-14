<template>
  <s-card flat class="entity-panel">
    <div
      class="panel-header"
      :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
    >
      <q-icon name="store" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Branches') }}
      </div>
      <q-space />
      <q-badge color="white" text-color="primary" class="q-px-sm q-mr-sm">
        {{ branches.length }}
      </q-badge>
      <s-btn
        v-if="branches.length"
        round
        dense
        flat
        color="white"
        icon="map"
        @click="showMap = true"
      >
        <s-tooltip>{{ tdc('Show all branches on the map') }}</s-tooltip>
      </s-btn>
    </div>

    <BranchesMapDialog
      v-model="showMap"
      :title="tdc('Branches')"
      :fetch-url="`${Entity.safeUrl}/${entityId}/branchs/`"
    />

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner size="32px" color="primary" />
    </div>

    <q-list v-else-if="branches.length" separator>
      <q-item
        v-for="branch in branches"
        :key="branch.id"
        clickable
        @click="goToBranch(branch.id)"
      >
        <q-item-section avatar>
          <q-avatar
            :color="branch.state === 'Active' ? 'primary' : 'grey-5'"
            text-color="white"
            size="36px"
          >
            <q-icon name="store" size="18px" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ branch.name }}</q-item-label>
          <q-item-label caption>
            <q-badge
              :color="branch.state === 'Active' ? 'positive' : 'grey-6'"
              text-color="white"
              rounded
            >
              {{ branch.state }}
            </q-badge>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <s-btn
            round
            dense
            flat
            color="primary"
            icon="edit"
            @click.stop="goToBranch(branch.id)"
          >
            <s-tooltip>{{ tdc('Edit branch') }}</s-tooltip>
          </s-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-center text-caption text-grey q-pa-lg">
      <q-icon name="store_mall_directory" size="32px" class="q-mb-xs" />
      <div>{{ tdc('No branches yet.') }}</div>
    </div>
  </s-card>
</template>


<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useEntityStore } from '../../stores/EntityStore'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'
import BranchesMapDialog from '../../components/address/BranchesMapDialog.vue'

const props = defineProps({
  entityId: [String, Number]
})

const router = useRouter()
const Entity = useEntityStore()

const branches = ref([])
const loading = ref(false)
const showMap = ref(false)

async function load() {
  if (!props.entityId) {
    branches.value = []
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `${Entity.safeUrl}/${props.entityId}/branchs/` })
    )
    branches.value = data || []
  } finally {
    loading.value = false
  }
}

function goToBranch(id) {
  router.push({ name: 'change_branch', params: { id } })
}

watch(() => props.entityId, load)
onMounted(load)
</script>


<style scoped>
.entity-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}
</style>
