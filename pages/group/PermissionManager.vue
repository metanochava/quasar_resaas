<template>
  <q-page class="column full-height">

    <!-- 🔥 HEADER -->
    <div class="q-pa-sm">

      <q-input
        dense
        outlined
        v-model="Permission.search"
        label="Pesquisar"
        @update:model-value="Permission.buildApps"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- 🔥 STATUS -->
      <div class="text-caption q-mt-xs text-grey">
        <span v-if="Permission.saving">💾 Salvando...</span>
        <span v-else-if="Permission.lastSaved">
          ✔ Salvo {{ formatTime(Permission.lastSaved) }}
        </span>
      </div>

    </div>

    <q-separator />

    <!-- 🔥 BODY -->
    <div class="col scroll q-pa-sm">

      <q-card
        v-for="(app, appName) in Permission.apps"
        :key="appName"
        bordered flat class="q-mb-sm"
      >

        <q-expansion-item>

          <!-- 🔥 APP HEADER -->
          <template #header>
            <q-item-section>
              {{ appName }}
            </q-item-section>

            <q-item-section side>
              <q-btn
                dense flat icon="done_all"
                @click.stop="Permission.toggleApp(app, true)"
              />
              <q-btn
                dense flat icon="clear"
                @click.stop="Permission.toggleApp(app, false)"
              />
            </q-item-section>
          </template>

          <!-- 🔥 MODELS -->
          <div
            v-for="(modelPerms, modelName) in groupByModel(app)"
            :key="modelName"
            class="row items-center q-pa-sm"
          >

            <!-- MODEL -->
            <div class="col-4">
              {{ modelName }}
            </div>

            <!-- MODEL ACTIONS -->
            <div class="col-2">
              <q-btn dense flat icon="done"
                @click="Permission.toggleModel(modelPerms, true)" />
              <q-btn dense flat icon="close"
                @click="Permission.toggleModel(modelPerms, false)" />
            </div>

            <!-- PERMISSIONS -->
            <div class="col-6 row">

              <q-checkbox
                v-for="perm in orderPermissions(modelPerms)"
                :key="perm.id"
                :model-value="Permission.hasPermission(perm.id)"
                @update:model-value="() => Permission.toggle(perm)"
                dense
                :label="label(perm.codename)"
              />

            </div>

          </div>
        </q-expansion-item>
      </q-card>
    </div>
  </q-page>
</template>


<script setup>
import { onMounted } from 'vue'
import { usePermissionStore } from '../../stores/PermissionStore'


const props = defineProps({
  AllPermissions: Array,
  GroupPermissionsRe: Array,
  Group: Object
})

const Permission = usePermissionStore()

onMounted(() => {
  Permission.initPermissions(
    props.AllPermissions,
    props.GroupPermissionsRe,
    props.Group
  )
})

// helpers
function groupByModel(arr) {
  return arr.reduce((acc, item) => {
    if (!acc[item.content_type_model]) {
      acc[item.content_type_model] = []
    }
    acc[item.content_type_model].push(item)
    return acc
  }, {})
}

function orderPermissions(arr) {
  const order = ['add', 'view', 'change', 'delete', 'list']
  return arr.sort((a, b) => {
    const ra = order.findIndex(o => a.codename.includes(o))
    const rb = order.findIndex(o => b.codename.includes(o))
    return ra - rb
  })
}

function label(c) {
  return c.split('_')[0]
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString()
}
</script>