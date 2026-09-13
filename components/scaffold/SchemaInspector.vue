<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import FormSection from '../auto/FormSection.vue'

// Right panel (mega-prompt secção 43) - pure read-only presentation of
// the schema already built by GET resaasapps/<app>/<model>/schema/
// (ResaasSchemaBuilder, Schema 1.0 - engine/core/schema) - never a
// second, parallel metadata structure.
const props = defineProps({
  schema: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const fields = computed(() => props.schema?.fields || [])
const actions = computed(() => props.schema?.actions || [])
const permissions = computed(() => {
  const p = props.schema?.permissions
  if (!p) return []
  if (Array.isArray(p)) return p
  return Object.entries(p).map(([action, codename]) => ({ action, codename }))
})
const routes = computed(() => {
  const r = props.schema?.routes
  if (!r) return []
  return Object.entries(r).map(([action, name]) => ({ action, name }))
})
</script>

<template>
  <div class="column full-height inspector">
    <div class="q-pa-sm text-subtitle2 text-weight-medium">{{ tdc('Schema') }}</div>
    <q-separator />

    <div class="col scroll q-pa-sm">
      <div v-if="loading" class="flex flex-center q-pa-lg">
        <q-spinner size="28px" color="primary" />
      </div>

      <div v-else-if="!schema" class="text-caption text-grey q-pa-md">
        {{ tdc('Select a model to inspect its schema') }}
      </div>

      <template v-else>
        <div class="text-subtitle1 text-weight-bold q-mb-sm">
          {{ schema.model?.label || schema.model?.name }}
        </div>

        <FormSection v-if="fields.length" title="Fields" icon="view_column">
          <div class="col-12">
            <div v-for="f in fields" :key="f.name" class="row items-center justify-between field-row">
              <div class="ellipsis">{{ f.name }}</div>
              <q-badge outline :color="f.relation ? 'secondary' : 'grey-7'">
                {{ f.relation ? 'Relation' : f.type }}
              </q-badge>
            </div>
          </div>
        </FormSection>

        <FormSection v-if="actions.length" title="Actions" icon="bolt">
          <div class="col-12 row q-gutter-xs">
            <q-chip v-for="a in actions" :key="a.action || a.name" dense size="sm">
              {{ a.label || a.action || a.name }}
            </q-chip>
          </div>
        </FormSection>

        <FormSection v-if="routes.length" title="Routes" icon="alt_route">
          <div class="col-12">
            <div v-for="r in routes" :key="r.action" class="text-caption route-row">
              <span class="text-weight-medium">{{ r.action }}</span>: {{ r.name }}
            </div>
          </div>
        </FormSection>

        <FormSection v-if="permissions.length" title="Permissions" icon="lock">
          <div class="col-12">
            <div v-for="p in permissions" :key="p.action" class="text-caption route-row">
              <span class="text-weight-medium">{{ p.action }}</span>: {{ p.codename }}
            </div>
          </div>
        </FormSection>
      </template>
    </div>
  </div>
</template>

<style scoped>
.inspector {
  min-height: 0;
}

.inspector > .col.scroll {
  min-height: 0;
}

.field-row, .route-row {
  padding: 2px 0;
  font-size: 12px;
}
</style>
