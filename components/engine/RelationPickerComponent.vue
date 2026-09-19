<script setup>
import { ref, computed, watch, useAttrs } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useRelationSearch } from '../../composables/useRelationSearch'
import { tdc } from '../../services/translation'
import RelationRecordDialog from './RelationRecordDialog.vue'

// Generic relation picker (schema variant "card"): search the related model,
// pick one result and see it as a card - avatar, title, subtitle, meta -
// with Change / Clear / View / Edit / Create new next to it.
//
// It knows NOTHING about which model it is showing. Everything comes from
// the schema field's relation_config (app, model, endpoint, permissions,
// preview); search, tenant scope and permissions are enforced by the related
// model's own endpoint (see useRelationSearch). Create/view/edit reuse the
// existing RelationRecordDialog (the same generic form the s-select "⋮" menu
// opens) - no CRUD of its own.
//
// The v-model is the same option shape every relation select already uses -
// {value, label} (plus id/preview when picked here) - so buildWritePayload/
// BaseStore turn it into the id on save, and a value loaded from the API's
// read shape ({id, value, label}) works unchanged.
defineOptions({ name: 's-relation-picker', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Object, String, Number], default: null },

  // A schema field (relation_config + label/allow_null) ...
  field: { type: Object, default: null },
  // ... or the relation_config on its own (buildFormFromSchema passes this)
  relationConfig: { type: Object, default: null },

  label: { type: String, default: '' },
  clearable: { type: Boolean, default: null },
  // A page that already has its own way to create/edit the related record
  // (add_employee's person form) turns the dialog actions off here.
  creatable: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  // Do not list anything until this many characters were typed - for
  // relations whose full list should not be shown unprompted.
  minChars: { type: Number, default: 0 },
  disable: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  rules: { type: Array, default: undefined },
  error: { type: [Boolean, String], default: false },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'selected', 'cleared'])

const attrs = useAttrs()
const User = useUserStore()

const config = computed(() => props.relationConfig || props.field?.relation_config || null)
const preview = computed(() => config.value?.preview || null)

const fieldLabel = computed(() => {
  const text = props.label || props.field?.label || props.field?.verbose_name || props.field?.name || ''
  return text ? tdc(text) : ''
})

const isClearable = computed(() => props.clearable ?? !!props.field?.allow_null)
const locked = computed(() => props.disable || props.readonly)

// ---------- capabilities (backend enforces; this is only UX) ----------
function allowed(action) {
  const perm = config.value?.permissions?.[action]
  return !!perm && User.can(perm)
}

// no list permission declared -> the endpoint itself decides
const canSearch = computed(() => {
  const perm = config.value?.permissions?.list
  return !perm || User.can(perm)
})

const selection = computed(() => {
  const v = props.modelValue
  if (v === null || v === undefined || v === '') return null
  return typeof v === 'object' ? v : { value: v, label: String(v) }
})

const hasSelection = computed(() => selection.value?.value != null)

const canAdd = computed(() => props.creatable && !locked.value && allowed('add'))
const canView = computed(() => hasSelection.value && allowed('view'))
const canEdit = computed(() => props.editable && !locked.value && hasSelection.value && allowed('change'))

// ---------- search ----------
const search = useRelationSearch(() => config.value)
const query = ref('')
const changing = ref(false)

const showSearch = computed(() => !hasSelection.value || changing.value)

const enoughChars = computed(() => query.value.trim().length >= props.minChars)

function openSearch() {
  if (locked.value) return

  changing.value = true
  query.value = ''

  if (canSearch.value && enoughChars.value) search.searchNow('')
}

function closeSearch() {
  changing.value = false
  query.value = ''
  search.reset()
}

function onQuery(value) {
  query.value = value ?? ''

  if (!enoughChars.value) {
    search.reset()
    return
  }

  search.search(query.value)
}

function choose(row) {
  emit('update:modelValue', row)
  emit('selected', row)
  closeSearch()
}

function clear() {
  emit('update:modelValue', null)
  emit('cleared')
  closeSearch()
}

// nothing selected: the results are shown right away, without a click
watch(
  () => [showSearch.value, canSearch.value, config.value?.endpoint],
  ([open, allowedToSearch]) => {
    if (open && allowedToSearch && enoughChars.value && !search.searched.value && !search.loading.value && !locked.value) {
      search.searchNow(query.value)
    }
  },
  { immediate: true }
)

// ---------- the selected value's preview ----------
// A value loaded from the API's read shape has no preview: fetch it once
// (through the same tenant/permission-checked endpoint), keep it local.
const resolved = ref(null)

watch(
  () => [selection.value?.value, !!selection.value?.preview],
  async ([value, hasPreview]) => {
    resolved.value = null

    if (value == null || hasPreview || !preview.value || !canSearch.value) return

    const row = await search.fetchOne(value)

    // ignore an answer for a value that is no longer the selected one
    if (row && selection.value?.value === value) resolved.value = row.preview
  },
  { immediate: true }
)

const shown = computed(() => {
  const data = selection.value?.preview || resolved.value

  return {
    title: data?.title || selection.value?.label || '',
    subtitle: data?.subtitle || [],
    meta: data?.meta || [],
    avatar: data?.avatar?.url || null
  }
})

function initialsOf(text) {
  return String(text || '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word[0].toUpperCase()).join('') || '?'
}

function rowView(row) {
  return {
    title: row.preview?.title || row.label,
    subtitle: row.preview?.subtitle || [],
    avatar: row.preview?.avatar?.url || null
  }
}

// ---------- create / view / edit (existing generic dialog) ----------
const showDialog = ref(false)
const dialogMode = ref('add')
const dialogRecordId = ref(null)

function openDialog(mode) {
  dialogMode.value = mode
  dialogRecordId.value = mode === 'add' ? null : selection.value?.value
  showDialog.value = true
}

// Shared by create and edit: the record the dialog saved becomes (or
// refreshes) the selection, with its preview looked up again.
async function onSaved(record) {
  const id = record?.id ?? record?.value
  const row = (await search.fetchOne(id)) || {
    value: id,
    id,
    label: record?.label || String(id),
    preview: null
  }

  emit('update:modelValue', row)
  emit('selected', row)
  closeSearch()
}

// the props a plain field would forward (data-*, class, style) - the
// select-only ones autoForm also passes (options, onFilter, ...) are dropped
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const density = computed(() => attrs.dense ?? User.ps?.layout?.dense)
</script>

<template>
  <q-field
    v-bind="rootAttrs"
    :model-value="hasSelection ? selection.value : null"
    :label="fieldLabel"
    :rules="rules"
    :error="!!error"
    :error-message="typeof error === 'string' && error ? error : errorMessage"
    :disable="disable"
    :dense="density"
    stack-label
    outlined
    class="relation-picker"
  >
    <template #control>
      <div class="relation-picker__body full-width">

        <!-- ================= SELECTED ================= -->
        <div v-if="!showSearch" class="relation-card" data-test="relation-selected">
          <q-avatar size="44px" class="relation-avatar">
            <img v-if="shown.avatar" :src="shown.avatar" :alt="shown.title">
            <span v-else>{{ initialsOf(shown.title) }}</span>
          </q-avatar>

          <div class="relation-text col">
            <div class="relation-title ellipsis">{{ shown.title }}</div>
            <div v-for="line in shown.subtitle" :key="line" class="relation-subtitle ellipsis">{{ line }}</div>
            <div v-if="shown.meta.length" class="relation-meta">
              <span v-for="item in shown.meta" :key="item.field">
                {{ tdc(item.label) }}: {{ item.value }}
              </span>
            </div>
          </div>

          <div class="relation-actions">
            <q-chip dense square icon="check_circle" color="positive" text-color="white" class="relation-badge">
              {{ tdc('Selected') }}
            </q-chip>
            <div class="row justify-end q-gutter-xs">
              <s-btn v-if="!locked && canSearch" flat dense size="sm" icon="swap_horiz" :label="tdc('Change')" data-test="relation-change" @click.stop="openSearch" />
              <s-btn v-if="canView" flat dense size="sm" icon="visibility" :label="tdc('View')" data-test="relation-view" @click.stop="openDialog('view')" />
              <s-btn v-if="canEdit" flat dense size="sm" icon="edit" :label="tdc('Edit')" data-test="relation-edit" @click.stop="openDialog('edit')" />
              <s-btn v-if="!locked && isClearable" flat dense size="sm" color="negative" icon="close" :label="tdc('Clear')" data-test="relation-clear" @click.stop="clear" />
            </div>
          </div>
        </div>

        <!-- ================= SEARCH ================= -->
        <div v-else class="relation-search">
          <div v-if="canSearch" class="row items-center no-wrap q-gutter-x-sm">
            <s-input
              class="col"
              dense
              outlined
              autofocus
              clearable
              :model-value="query"
              :placeholder="tdc('Type to search')"
              :disable="locked"
              data-test="relation-query"
              @update:model-value="onQuery"
            >
              <template #prepend><q-icon name="search" /></template>
            </s-input>

            <s-btn v-if="hasSelection" flat dense :label="tdc('Cancel')" data-test="relation-cancel" @click.stop="closeSearch" />
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
              @click.stop="choose(row)"
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
            <s-btn flat dense size="sm" color="primary" icon="add" :label="tdc('Create new')" data-test="relation-create" @click.stop="openDialog('add')" />
          </div>
        </div>

      </div>
    </template>
  </q-field>

  <RelationRecordDialog
    v-if="config"
    v-model="showDialog"
    :relation-config="config"
    :mode="dialogMode"
    :record-id="dialogRecordId"
    @saved="onSaved"
  />
</template>

<style scoped>
.relation-picker__body { padding: 6px 0; min-width: 0; }

.relation-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}
.relation-text { min-width: 0; flex: 1 1 180px; }
.relation-title { font-weight: 600; font-size: 15px; }
.relation-subtitle { font-size: 13px; opacity: .75; }
.relation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin-top: 2px;
  font-size: 12px;
  opacity: .6;
}
.relation-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: auto;
}
.relation-badge { margin: 0; }

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

@media (max-width: 599px) {
  .relation-actions { align-items: stretch; width: 100%; margin-left: 0; }
  .relation-actions .row { justify-content: flex-start; }
}
</style>
