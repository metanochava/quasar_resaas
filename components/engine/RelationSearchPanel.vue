<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { initialsOf, rowView } from '../../utils/relationRow'

// The search half of the relation picker: query input, results, empty /
// minimum-characters states, "Load more" and "Create new". Presentational
// only - the search state comes from useRelationSearch() (`search`) and every
// decision is emitted back to <s-relation-picker>, which renders this panel
// inline or inside a modal.
const props = defineProps({
  search: { type: Object, required: true },
  query: { type: String, default: '' },
  minChars: { type: Number, default: 0 },
  canSearch: { type: Boolean, default: true },
  canAdd: { type: Boolean, default: false },
  showCancel: { type: Boolean, default: false },
  locked: { type: Boolean, default: false }
})

const emit = defineEmits(['update:query', 'choose', 'cancel', 'create'])

const enoughChars = computed(() => props.query.trim().length >= props.minChars)
</script>

<template>
  <div class="relation-search">
    <div v-if="canSearch" class="row items-center no-wrap q-gutter-x-sm">
      <s-input
        class="col"
        dense
        outlined
        autofocus
        clearable
        type="search"
        :model-value="query"
        :placeholder="tdc('Type to search')"
        :disable="locked"
        data-test="relation-query"
        @update:model-value="value => emit('update:query', value ?? '')"
      />

      <s-btn v-if="showCancel" flat dense :label="tdc('Cancel')" data-test="relation-cancel" @click.stop="emit('cancel')" />
    </div>

    <div v-else class="text-caption text-grey-7 q-pa-sm" data-test="relation-no-search">
      {{ tdc('You do not have permission to search this list.') }}
    </div>

    <q-linear-progress v-if="search.loading.value" indeterminate size="2px" class="q-mt-xs" />

    <q-list v-if="canSearch && search.results.value.length" separator class="relation-results">
      <q-item
        v-for="row in search.results.value"
        :key="row.value"
        clickable
        v-ripple
        data-test="relation-result"
        @click.stop="emit('choose', row)"
      >
        <q-item-section avatar>
          <q-avatar size="36px" class="relation-avatar">
            <img v-if="rowView(row).avatar" :src="rowView(row).avatar" :alt="rowView(row).title">
            <span v-else>{{ initialsOf(rowView(row).title) }}</span>
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="ellipsis">{{ rowView(row).title }}</q-item-label>
          <q-item-label v-if="rowView(row).subtitle.length" caption class="ellipsis">
            {{ rowView(row).subtitle.join(' · ') }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <span class="text-primary text-caption">{{ tdc('Select') }} →</span>
        </q-item-section>
      </q-item>
    </q-list>

    <div
      v-else-if="canSearch && !enoughChars"
      class="text-caption text-grey-7 q-pa-sm"
      data-test="relation-min-chars"
    >
      {{ tdc('Type at least') }} {{ minChars }} {{ tdc('characters to search') }}
    </div>

    <div
      v-else-if="canSearch && search.searched.value && !search.loading.value"
      class="text-caption text-grey-7 q-pa-sm"
      data-test="relation-empty"
    >
      {{ search.failed.value ? tdc('Could not load the results.') : tdc('No results found') }}
    </div>

    <div v-if="canSearch && search.hasMore.value" class="row justify-center q-mt-xs">
      <s-btn
        flat dense size="sm"
        :loading="search.loadingMore.value"
        :label="tdc('Load more')"
        data-test="relation-more"
        @click.stop="search.loadMore()"
      />
    </div>

    <div v-if="canAdd" class="row justify-center q-mt-xs">
      <s-btn flat dense size="sm" color="primary" icon="add" :label="tdc('Create new')" data-test="relation-create" @click.stop="emit('create')" />
    </div>
  </div>
</template>

<style scoped>
.relation-avatar {
  background: color-mix(in srgb, var(--q-primary) 14%, transparent);
  color: var(--q-primary);
  font-weight: 700;
}

.relation-results {
  max-height: 260px;
  overflow-y: auto;
  margin-top: 4px;
  border: 1px solid rgba(128, 128, 128, .25);
  border-radius: var(--s-radius, 8px);
}
</style>
