<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="school" class="q-mr-xs" />
          {{ tdc('Training') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-card-section v-else class="row q-col-gutter-md">
        <div class="col-6">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Sessions (30 days)') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.upcoming_sessions_count }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Enrollments') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.upcoming_sessions_enrollments }}</div>
            </q-card-section>
          </s-card>
        </div>
      </q-card-section>
    </s-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { tdc } from '../../../services/translation'
import { HTTPAuth, url } from '../../../services/api'

const loading = ref(true)
const data = ref({
  upcoming_sessions_count: 0,
  upcoming_sessions_enrollments: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_formacao',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>
