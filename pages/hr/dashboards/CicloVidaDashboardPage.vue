<template>
  <q-page class="q-pa-sm">
    <s-card flat bordered>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="compare_arrows" class="q-mr-xs" />
          {{ tdc('Employee Lifecycle') }}
        </div>
      </q-card-section>

      <q-separator />

      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <q-card-section v-else class="row q-col-gutter-md">
        <div class="col-6 col-md-3">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Promotions') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.promotions_this_period }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6 col-md-3">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Resignations') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.resignations_this_period }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6 col-md-3">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Contract Terminations') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.terminations_this_period }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6 col-md-3">
          <s-card flat bordered class="border-negative">
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Active Disciplinary Cases') }}</div>
              <div class="text-h5 text-weight-bold text-negative">{{ data.active_disciplinary_cases }}</div>
            </q-card-section>
          </s-card>
        </div>
        <div class="col-6 col-md-3">
          <s-card flat bordered>
            <q-card-section>
              <div class="text-caption text-grey-6">{{ tdc('Offboarding In Progress') }}</div>
              <div class="text-h5 text-weight-bold">{{ data.offboarding_in_progress }}</div>
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
  promotions_this_period: 0,
  terminations_this_period: 0,
  resignations_this_period: 0,
  active_disciplinary_cases: 0,
  offboarding_in_progress: 0,
})

onMounted(async () => {
  loading.value = true
  try {
    const { data: response } = await HTTPAuth.get(url({
      type: 'u',
      url: 'hr/dashboard_ciclo_vida',
    }))
    data.value = response
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.border-negative {
  border-color: var(--q-negative) !important;
}
</style>
