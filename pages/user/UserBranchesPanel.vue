<template>
  <s-card flat class="user-panel">
    <div class="panel-header" :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-icon name="store" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Branches') }}
      </div>
      <q-space />
      <q-badge color="white" text-color="primary" class="q-px-sm">
        {{ selected.length }}
      </q-badge>
    </div>

    <q-card-section class="q-pa-md">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        :label="tdc('Search branch')"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-separator />

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <q-list v-else-if="filteredBranches.length" separator>
      <q-item
        v-for="branch in filteredBranches"
        :key="branch.id"
        clickable
        v-ripple
        @click="toggle(branch)"
      >
        <q-item-section avatar>
          <q-avatar
            :color="isSelected(branch.id) ? 'primary' : 'grey-4'"
            :text-color="isSelected(branch.id) ? 'white' : 'dark'"
            icon="store"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ branch.name }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-checkbox
            :model-value="isSelected(branch.id)"
            color="primary"
            @click.stop
            @update:model-value="() => toggle(branch)"
          />
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
import { computed, onMounted, ref, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

// UserAPIView.userBranchs/addUserBranch/removeUserBranch (django_resaas/
// saas/data/user/views/user.py) are scoped to the ADMIN'S own current
// tenant context (request.entity_id/entity_type_id) - this panel only
// ever shows/assigns branches within the admin's own Entity, which
// matches list_user's own tenant scope (UserAPIView.get_queryset()).
const props = defineProps({
  userId: [String, Number]
})

const allBranches = ref([])
const selected = ref([])
const loading = ref(false)
const search = ref('')

const filteredBranches = computed(() => {
  const q = (search.value || '').toLowerCase()
  return allBranches.value.filter(b => !q || String(b.name || '').toLowerCase().includes(q))
})

function isSelected(id) {
  return selected.value.some(b => b.id === id)
}

async function load() {
  if (!props.userId) {
    allBranches.value = []
    selected.value = []
    return
  }

  loading.value = true

  try {
    const [all, mine] = await Promise.all([
      HTTPAuth.get(url({ type: 'u', url: 'django_resaas/branchs/', params: { page_size: 0 } })),
      HTTPAuth.get(url({ type: 'u', url: `django_resaas/users/${props.userId}/userBranchs/` }))
    ])

    allBranches.value = all.data?.results || []
    selected.value = mine.data || []
  } finally {
    loading.value = false
  }
}

async function toggle(branch) {
  const exists = isSelected(branch.id)
  const endpoint = exists ? 'removeUserBranch' : 'addUserBranch'

  await HTTPAuth.post(
    url({ type: 'u', url: `django_resaas/users/${props.userId}/${endpoint}/` }),
    { branch: branch.id }
  )

  if (exists) {
    selected.value = selected.value.filter(b => b.id !== branch.id)
  } else {
    selected.value = [...selected.value, branch]
  }
}

watch(() => props.userId, load)
onMounted(load)
</script>

<style scoped>
.user-panel {
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
}
</style>
