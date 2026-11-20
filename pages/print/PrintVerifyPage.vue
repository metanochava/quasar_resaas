<template>
  <!-- /v/:token - the page a printed document's QR code opens (public, no
       session). The backend checks the signed token and answers only the
       document's public fields (django_resaas core/printing/verify.py). -->
  <q-page class="row justify-center items-start q-pa-md" data-test="print-verify">
    <s-card flat bordered class="verify-card q-pa-lg">
      <div v-if="loading" class="flex flex-center q-pa-lg">
        <q-spinner color="primary" size="48px" />
      </div>

      <template v-else-if="result">
        <div class="column items-center text-center q-mb-md">
          <q-icon :name="result.voided ? 'block' : 'verified'" :color="result.voided ? 'negative' : 'positive'" size="64px" />
          <div class="text-h6 q-mt-sm" data-test="print-verify-title">
            {{ tdc(result.voided ? 'Voided document' : 'Authentic document') }}
          </div>
          <div class="text-caption text-grey-7">
            {{ tdc(result.voided ? 'This system issued it, but it no longer counts' : 'Issued by this system and valid') }}
          </div>
        </div>

        <q-list bordered separator class="rounded-borders">
          <q-item>
            <q-item-section>
              <q-item-label caption>{{ tdc('Document') }}</q-item-label>
              <q-item-label class="text-weight-medium">{{ result.document }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="result.entity">
            <q-item-section>
              <q-item-label caption>{{ tdc('Issued by') }}</q-item-label>
              <q-item-label class="text-weight-medium">{{ result.entity }}<span v-if="result.branch"> · {{ result.branch }}</span></q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-for="field in result.fields" :key="field.label" data-test="print-verify-field">
            <q-item-section>
              <q-item-label caption>{{ field.label }}</q-item-label>
              <q-item-label class="text-weight-medium">{{ field.value }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <div v-else class="column items-center text-center" data-test="print-verify-unknown">
        <q-icon name="gpp_bad" color="negative" size="64px" />
        <div class="text-h6 q-mt-sm">{{ tdc('Document not recognised') }}</div>
        <div class="text-caption text-grey-7">{{ tdc('This document was not issued by this system.') }}</div>
      </div>
    </s-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { HTTPClient, url } from '../../services/api'
import { tdc } from '../../services/translation'

const route = useRoute()
const loading = ref(true)
const result = ref(null)

async function load () {
  loading.value = true
  result.value = null
  // a probe whose 404 is an answer ("not ours"): no error toast, no throw
  const response = await HTTPClient
    .get(url({ type: 'u', url: `printing/verify/${route.params.token}/` }), { silent: true })
    .catch(() => null)
  result.value = response?.data || null
  loading.value = false
}

onMounted(load)
watch(() => route.params.token, load)
</script>

<style scoped>
.verify-card {
  width: 100%;
  max-width: 440px;
}
</style>
