<template>
  <s-card flat class="user-panel">
    <div class="panel-header" :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-icon name="badge" size="20px" color="white" />
      <div class="text-subtitle1 text-weight-bold text-white q-ml-sm">
        {{ tdc('Person') }}
      </div>
    </div>

    <div v-if="loading" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <q-card-section v-else-if="person">
      <div class="text-weight-medium">{{ person.full_name || person.name }}</div>
      <div v-if="person.email" class="text-caption text-grey">{{ person.email }}</div>
      <div v-if="person.phone" class="text-caption text-grey">{{ person.phone }}</div>
    </q-card-section>

    <div v-else class="text-center text-caption text-grey q-pa-lg">
      <q-icon name="badge" size="32px" class="q-mb-xs" />
      <div>{{ tdc('No linked person.') }}</div>
    </div>
  </s-card>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { HTTPAuth, url } from '../../services/api'
import { tdc } from '../../services/translation'

// UserAPIView.userPerson (django_resaas/saas/data/user/views/user.py)
// returns the Person linked via Person.user (OneToOneField), or {} when
// this User has none (Person/User/Employee stay distinct concepts -
// CLAUDE.md §12, not every User has a Person record).
const props = defineProps({
  userId: [String, Number]
})

const person = ref(null)
const loading = ref(false)

async function load() {
  if (!props.userId) {
    person.value = null
    return
  }

  loading.value = true

  try {
    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `django_resaas/users/${props.userId}/userPerson/` })
    )
    person.value = data?.id ? data : null
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
