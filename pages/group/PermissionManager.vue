<template>
  <q-page class="column full-height">

    <!-- HEADER -->
    <div class="q-pa-sm">
      <q-input
        dense outlined
        v-model="Permission.search"
        label="Pesquisar"
        @update:model-value="Permission.buildApps"
      >
        <template #append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-separator />

    <!-- BODY -->
    <div class="col scroll q-pa-sm">

      <q-card
        v-for="(models, appName) in Permission.apps"
        :key="appName"
        class="q-mb-sm"
        flat bordered
      >
        <q-expansion-item expand-separator>

          <!-- APP -->
          <template #header>
            <q-item-section avatar>
              <q-checkbox
                :model-value="Permission.appState(models).checked"
                :indeterminate="Permission.appState(models).indeterminate"
                @update:model-value="val => Permission.toggleApp(models, val)"
              />
            </q-item-section>

            <q-item-section>
              <div class="text-bold text-primary">
                {{ appName }}
              </div>
              <div class="text-caption text-grey">
                {{ Object.keys(models).length }} modelos
              </div>
            </q-item-section>
          </template>

          <!-- MODELS -->
          <div
            v-for="(perms, modelName) in models"
            :key="modelName"
            class="q-pa-sm"
          >
            <div class="row items-center">

              <!-- MODEL -->
              <div class="col-12 text-center">
                <q-checkbox
                  :model-value="Permission.modelState(perms).checked"
                  :indeterminate="Permission.modelState(perms).indeterminate"
                  @update:model-value="val => toggleModel(perms, val)"
                >
                  <div>
                    <div class="text-bold">{{ modelName }}</div>
                    <div class="text-caption text-grey">
                      {{ perms.length }} permissões
                    </div>
                  </div>
                </q-checkbox>
              </div>

              <!-- PERMISSIONS -->
              <div class="col-12 row q-gutter-sm">
                <q-checkbox
                  v-for="perm in orderPermissions(perms)"
                  :key="perm.id"
                  :model-value="Permission.hasPermission(perm.id)"
                  @update:model-value="() => Permission.toggle(perm)"
                  :label="label(perm.codename, modelName )"
                  dense
                  :disable="Permission.loadingPermission"
                />
              </div>

            </div>

            <q-separator class="q-my-sm" />
          </div>

        </q-expansion-item>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { watch } from 'vue'
import { usePermissionStore } from '../../stores/PermissionStore'

const props = defineProps({
  AllPermissions: Array,
  GroupPermissionsRe: Array,
  Group: Object
})

const Permission = usePermissionStore()

// 🔥 REATIVO (resolve problema de dados vazios)
watch(
  () => [props.AllPermissions, props.GroupPermissionsRe, props.Group],
  () => {
    Permission.initPermissions(
      props.AllPermissions,
      props.GroupPermissionsRe,
      props.Group
    )
  },
  { immediate: true }
)

function toggleModel(perms, state) {
  perms.forEach(p => {
    const has = Permission.hasPermission(p.id)

    if (state && !has) Permission.toggle(p)
    if (!state && has) Permission.toggle(p)
  })
}

function orderPermissions(arr) {
  const order = ['add', 'view', 'change', 'delete', 'list', 'pdf']
  return [...arr].sort((a, b) => {
    const ra = order.findIndex(o => a.codename.includes(o))
    const rb = order.findIndex(o => b.codename.includes(o))
    return ra - rb
  })
}

function label(c,m) {
  return c.replaceAll(m,'')
}
</script>