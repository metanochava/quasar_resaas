<script setup>
import { onMounted } from 'vue'
import { useEntityTypeStore }  from '../../stores/EntityTypeStore'
import { tdc } from '../../services/translation'



const props = defineProps({
  entityTypeId: {
    type: [String, Number],
    default: null
  }
})

const EntityType = useEntityTypeStore()

// ===============================
// INIT
// ===============================
onMounted(async () => {
  await EntityType.initModels(props.entityTypeId)
})

// ===============================
// HELPERS
// ===============================
function formatName(value) {
  return (value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

function allSelected(models) {
  return models.every(m => EntityType.isSelected(m.id))
}

function toggleGroup(models, checked) {
  models.forEach(item => {
    const exists = EntityType.isSelected(item.id)

    if (checked && !exists) EntityType.toggleModel(item)
    if (!checked && exists) EntityType.toggleModel(item)
  })
}
</script>
<template>

  <s-modal-card :title="tdc('Models Management')" icon="table_chart" fullscreen flush>
    <template #bar-actions>
      <div class="row items-center q-gutter-sm">
        <q-icon v-if="EntityType.models.status === 'saving'" name="sync" class="routete" />
        <q-icon v-else-if="EntityType.models.status === 'saved'" name="check_circle" color="positive" />
        <q-icon v-else-if="EntityType.models.status === 'error'" name="error" color="negative" />

        <span class="text-caption">
          <span v-if="EntityType.models.status === 'saving'">{{ tdc('Saving...') }}</span>
          <span v-else-if="EntityType.models.status === 'saved'">{{ tdc('Saved') }}</span>
          <span v-else-if="EntityType.models.status === 'error'">{{ tdc('Error saving') }}</span>
          <span v-else>{{ tdc('Pending changes') }}</span>
        </span>
      </div>
    </template>

    <template #subheader>
      <q-input
        v-model="EntityType.models.permissionSearch"
        outlined
        dense
        clearable
        :label="tdc('Search')"
        @update:model-value="EntityType.filterPermissions"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>

    <div class="col scroll" style="min-height: 0;">

      <div v-if="EntityType.models.loadingModels" class="flex flex-center q-pa-xl">
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <q-list v-else separator>

        <q-expansion-item
          v-for="(models, app) in EntityType.groupedModels"
          :key="app"
          expand-separator
          icon="models"
        >

          <!-- HEADER -->
          <template #header>
            <q-item-section avatar>
              <q-icon name="models" color="primary" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ formatName(app) }}
              </q-item-label>
              <q-item-label caption>
                {{ models.length }} {{ tdc('models') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                :model-value="allSelected(models)"
                @click.stop
                @update:model-value="val => toggleGroup(models, val)"
              />
            </q-item-section>
          </template>

          <!-- ITEMS -->
          <q-item
            v-for="item in models"
            :key="item.id"
            clickable
            v-ripple
            @click="EntityType.toggleModel(item)"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="EntityType.isSelected(item.id)"
                @click.stop
                @update:model-value="() => EntityType.toggleModel(item)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ formatName(item.model) }}
              </q-item-label>
              <q-item-label caption>
                {{ item.app_label }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge
                :color="EntityType.isSelected(item.id) ? 'primary' : 'grey'"
                outline
              >
                {{ EntityType.isSelected(item.id) ? tdc('Active') : tdc('Inactive') }}
              </q-badge>
            </q-item-section>

          </q-item>

        </q-expansion-item>

      </q-list>

    </div>
  </s-modal-card>
</template>