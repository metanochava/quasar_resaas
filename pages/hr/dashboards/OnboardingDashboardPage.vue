<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="checklist" class="q-mr-xs" />
          {{ tdc('Onboarding') }}
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
              <div class="text-caption text-grey-6">{{ tdc('In Progress') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.onboardings_in_progress }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Completed This Month') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.onboardings_completed_this_month }}</div>
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
  onboardings_in_progress: 0,
  onboardings_completed_this_month: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_onboarding',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>
