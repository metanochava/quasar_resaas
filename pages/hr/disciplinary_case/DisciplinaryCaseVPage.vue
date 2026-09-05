<template>
  <q-page class="q-pa-sm">
    <!-- FORM -->
    <div v-if="DisciplinaryCase.loading" class="flex flex-center q-pa-lg">
      <q-spinner size="40px" color="primary" />
    </div>
    <template v-else>
      <FormTwo
        :store="DisciplinaryCase"
        :ignore-fields="ignoreFields"
        @saved="onSaved"
      />

      <!-- WORKFLOW (start_review/resolve/dismiss - hr/services/lifecycle_service.py) -->
      <s-card class="q-mt-md">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <q-badge :color="statusColor(DisciplinaryCase.row?.status)" class="q-pa-sm">
              {{ DisciplinaryCase.row?.status?.label || DisciplinaryCase.row?.status }}
            </q-badge>
          </div>
          <div class="col-auto q-gutter-sm" v-if="isCaseOpen">
            <s-btn
              v-if="(DisciplinaryCase.row?.status?.value || DisciplinaryCase.row?.status) === 'open'"
              flat color="warning" icon="rate_review" :label="tdc('Start review')"
              :loading="actionLoading" @click="doAction('start_review')"
            />
            <s-btn
              v-if="(DisciplinaryCase.row?.status?.value || DisciplinaryCase.row?.status) === 'under_review'"
              flat color="positive" icon="task_alt" :label="tdc('Resolve')"
              :loading="actionLoading" @click="doAction('resolve')"
            />
            <s-btn
              flat color="negative" icon="cancel" :label="tdc('Dismiss')"
              :loading="actionLoading" @click="doAction('dismiss')"
            />
          </div>
        </q-card-section>
        <div v-if="actionError" class="text-negative text-caption q-px-md q-pb-md">{{ actionError }}</div>
      </s-card>
    </template>
  </q-page>
</template>


<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisciplinaryCaseStore } from '../../../stores/DisciplinaryCaseStore.js'
import { HTTPAuth, url } from '../../../services/api.js'
import { tdc } from '../../../services/translation.js'
import FormTwo from '../../../components/auto/FormTwo.vue'

const route = useRoute()
const DisciplinaryCase = useDisciplinaryCaseStore()

const ready = ref(false)
const actionLoading = ref(false)
const actionError = ref('')

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

const isCaseOpen = computed(() => {
  const value = DisciplinaryCase.row?.status?.value || DisciplinaryCase.row?.status
  return value === 'open' || value === 'under_review'
})

function statusColor(status) {
  const value = status?.value || status
  switch (value) {
    case 'resolved': return 'positive'
    case 'dismissed': return 'grey-7'
    case 'under_review': return 'warning'
    default: return 'negative'
  }
}

async function doAction(action) {
  actionError.value = ''
  actionLoading.value = true

  try {
    await HTTPAuth.post(
      url({ type: 'u', url: `hr/disciplinarycases/${DisciplinaryCase.row.id}/${action}/` })
    )
    DisciplinaryCase.row = await DisciplinaryCase.getById(DisciplinaryCase.row.id)
  } catch (err) {
    actionError.value = err?.response?.data?.detail || tdc('Could not update this case.')
  } finally {
    actionLoading.value = false
  }
}

async function load(id) {
  if (!id) {
    DisciplinaryCase.resetForm?.()
    return
  }

  if (String(DisciplinaryCase.row?.id) === String(id)) {
    DisciplinaryCase.form = DisciplinaryCase.row
    return
  }

  DisciplinaryCase.row = await DisciplinaryCase.getById(id)
}

async function init() {
  try {
    ready.value = false
    await DisciplinaryCase.init()

    const id = route.params.id
    await load(id)

    ready.value = true
  } catch (err) {
    console.error('Error initializing page:', err)
  }
}

watch(
  () => route.params,
  async (params) => {
    if (!params) return
    await load(params.id)
  },
  { immediate: false }
)

function onSaved(res) {
}

onMounted(init)
</script>
