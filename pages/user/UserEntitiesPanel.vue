<template>
  <s-card flat class="user-panel">
    <div class="panel-header" :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-icon name="apartment" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Entities') }}
      </div>
      <q-space />
      <q-badge v-if="!forbidden" color="white" text-color="primary" class="q-px-sm">
        {{ entities.length }}
      </q-badge>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <!-- UserAPIView.userEntitys only allows a superuser or the user
         themselves (user.py) - a tenant admin editing someone else
         gets a 403. That's an existing, deliberate permission
         boundary, not an error to surface loudly here. -->
    <div v-else-if="forbidden" class="text-center text-caption text-grey q-pa-lg">
      <q-icon name="lock_outline" size="32px" class="q-mb-xs" />
      <div>{{ tdc('Not visible with your current permissions.') }}</div>
    </div>

    <q-list v-else-if="entities.length" separator>
      <q-item v-for="entity in entities" :key="entity.id">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" icon="apartment" size="36px" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-medium">{{ entity.name }}</q-item-label>
          <q-item-label caption>{{ entity.entityType?.label || entity.entityType?.name || '' }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-center text-caption text-grey q-pa-lg">
      <q-icon name="apartment" size="32px" class="q-mb-xs" />
      <div>{{ tdc('No entities yet.') }}</div>
    </div>
  </s-card>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

const props = defineProps({
  userId: [String, Number]
})

const entities = ref([])
const loading = ref(false)
const forbidden = ref(false)

async function load() {
  if (!props.userId) {
    entities.value = []
    return
  }

  loading.value = true
  forbidden.value = false

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `django_resaas/users/${props.userId}/userEntitys/` })
    )
    entities.value = data || []
  } catch (e) {
    if (e?.response?.status === 403) {
      forbidden.value = true
      entities.value = []
    } else {
      throw e
    }
  } finally {
    loading.value = false
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
