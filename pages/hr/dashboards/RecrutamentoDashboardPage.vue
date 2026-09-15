<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="work" class="q-mr-xs" />
          {{ tdc('Recruitment') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <q-card-section v-else class="row q-col-gutter-md">
        <div class="col-4">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Open Job Openings') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.open_job_openings }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-4">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Applications This Month') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.applications_this_month }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-4">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Interviews (7 days)') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.upcoming_interviews }}</div>
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
  open_job_openings: 0,
  applications_this_month: 0,
  upcoming_interviews: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_recrutamento',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>
