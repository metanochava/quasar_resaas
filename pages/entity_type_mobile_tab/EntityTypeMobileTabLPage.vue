<template>
  <q-page class="q-pa-sm">
    <!-- an Entity Type's phone bottom tabs (Root's template); each profile
         only ever sees the tabs its permissions allow -->
    <div v-if="User.can('add_entitytypemobiletab')" class="row q-col-gutter-sm items-center q-mb-sm">
      <div class="col-12 col-sm-6">
        <s-select v-model="entityType" :api="entityTypeUrl" option-label="label" option-value="value" emit-value map-options clearable dense :label="tdc('Entity type')" />
      </div>
      <div class="col-12 col-sm-6">
        <s-btn outline rounded no-caps icon="auto_awesome" :label="tdc('Suggest tabs')" :disable="!entityType" :loading="busy" data-test="mobile-tabs-seed" @click="seed">
          <s-tooltip>{{ tdc('Add the tabs the active modules of this entity type suggest') }}</s-tooltip>
        </s-btn>
      </div>
    </div>
    <AutoCrud
      :key="reload" :app="app" :model="model" :can="User.can"
      :ignoreFields="ignore" :ignoreFieldsFilter="ignore"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import AutoCrud from '../../components/auto/AutoCrud.vue'
import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import { errorMessage } from '../../utils/apiContract.js'

const $q = useQuasar()
const User = useUserStore()
const app = ref('django_resaas')
const model = ref('EntityTypeMobileTab')
const ignore = ['created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'state']
const entityType = ref(null)
const busy = ref(false)
const reload = ref(0)
const entityTypeUrl = url({ type: 'u', url: 'django_resaas/entitytypes', params: { select: 'true' } })

async function seed () {
  busy.value = true
  try {
    const { data } = await HTTPAuth.post(url({ type: 'u', url: 'django_resaas/entitytypemobiletabs/seed/' }), { entity_type: entityType.value })
    $q.notify({ type: 'positive', message: `${tdc('Tabs created')}: ${data.created}` })
    reload.value++
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) || tdc('An error occurred. Please try again.') })
  } finally {
    busy.value = false
  }
}
</script>
