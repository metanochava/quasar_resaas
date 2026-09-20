<script setup>
import { ref, computed, watch, useAttrs, getCurrentInstance } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useRelationSearch } from '../../composables/useRelationSearch'
import { tdc } from '../../services/translation'
import RelationRecordDialog from './RelationRecordDialog.vue'
import RelationSearchPanel from './RelationSearchPanel.vue'
import { initialsOf } from '../../utils/relationRow'

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
  // 'inline' (default): the picker is the card, search opens in place.
  // 'modal': a compact input - focusing/clicking it opens the search in a
  // modal; use it where the field must stay one line high (page headers).
  mode: { type: String, default: 'inline', validator: v => ['inline', 'modal'].includes(v) },
  placeholder: { type: String, default: '' },
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

// ---------- modal mode ----------
// mode='modal' from the page, or the schema's relation_config.variant
const isModal = computed(() => props.mode === 'modal' || config.value?.variant === 'modal')
const modalOpen = ref(false)

// Closing the modal hands focus back to the trigger input, whose @focus
// would reopen it straight away - ignore focus for a moment after a hide.
let ignoreFocusUntil = 0

function openModal(event) {
  if (locked.value || Date.now() < ignoreFocusUntil) return

  event?.target?.blur?.()
  query.value = ''
  modalOpen.value = true
}

// The dialog's @show fires after its transition - the user may already have
// typed, so the query is reset on open (above), never here.
function onModalShow() {
  if (canSearch.value && enoughChars.value && !search.searched.value && !search.loading.value) {
    search.searchNow(query.value)
  }
}

function onModalHide() {
  ignoreFocusUntil = Date.now() + 500
  query.value = ''
  search.reset()
}

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
  modalOpen.value = false
}

function clear() {
  emit('update:modelValue', null)
  emit('cleared')
  closeSearch()
  modalOpen.value = false
}

// nothing selected: the results are shown right away, without a click
watch(
  () => [showSearch.value, canSearch.value, config.value?.endpoint],
  ([open, allowedToSearch]) => {
    if (!isModal.value && open && allowedToSearch && enoughChars.value && !search.searched.value && !search.loading.value && !locked.value) {
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

// ---------- create / view / edit (existing generic dialog) ----------
const showDialog = ref(false)
const dialogMode = ref('add')
const dialogRecordId = ref(null)

// "View" shows ALL the data of the related record: its own page when the
// schema says which route that is (relation_config.routes.view - opened in a
// new tab so the form being filled is never lost), otherwise the generic
// read-only dialog.
const router = getCurrentInstance()?.appContext.config.globalProperties.$router

function openView() {
  const name = config.value?.routes?.view
  const id = selection.value?.value

  if (name && id != null && router?.hasRoute?.(name)) {
    window.open(router.resolve({ name, params: { id } }).href, '_blank', 'noopener')
    return
  }

  openDialog('view')
}

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
  <!-- ============ MODAL MODE: a compact input that opens the search ============ -->
  <template v-if="isModal">
    <q-input
      v-bind="rootAttrs"
      :model-value="hasSelection ? shown.title : ''"
      :placeholder="placeholder || tdc('Search')"
      :disable="disable"
      :dense="density"
      readonly
      outlined
      class="relation-trigger cursor-pointer"
      data-test="relation-trigger"
      @focus="openModal"
      @click="openModal"
    >
      <template #prepend><q-icon name="search" /></template>
      <template v-if="hasSelection && (canView || (!locked && isClearable))" #append>
        <q-icon v-if="canView" name="visibility" class="cursor-pointer" data-test="relation-view" @click.stop="openView">
          <s-tooltip>{{ tdc('View') }}</s-tooltip>
        </q-icon>
        <q-icon v-if="!locked && isClearable" name="close" class="cursor-pointer" data-test="relation-clear" @click.stop="clear">
          <s-tooltip>{{ tdc('Clear') }}</s-tooltip>
        </q-icon>
      </template>
    </q-input>

    <q-dialog v-model="modalOpen" @show="onModalShow" @hide="onModalHide">
      <s-card class="relation-modal">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold col">{{ fieldLabel || tdc('Search') }}</div>
          <s-btn flat round dense icon="close" data-test="relation-modal-close" @click="modalOpen = false" />
        </q-card-section>

        <q-card-section>
          <RelationSearchPanel
            :search="search"
            :query="query"
            :min-chars="minChars"
            :can-search="canSearch"
            :can-add="canAdd"
            :locked="locked"
            @update:query="onQuery"
            @choose="choose"
            @create="openDialog('add')"
          />
        </q-card-section>
      </s-card>
    </q-dialog>
  </template>

  <!-- ============ INLINE MODE: the card itself ============ -->
  <q-field
    v-else
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
              <s-btn v-if="canView" flat dense size="sm" icon="visibility" :label="tdc('View')" data-test="relation-view" @click.stop="openView" />
              <s-btn v-if="canEdit" flat dense size="sm" icon="edit" :label="tdc('Edit')" data-test="relation-edit" @click.stop="openDialog('edit')" />
              <s-btn v-if="!locked && isClearable" flat dense size="sm" color="negative" icon="close" :label="tdc('Clear')" data-test="relation-clear" @click.stop="clear" />
            </div>
          </div>
        </div>

        <!-- ================= SEARCH ================= -->
        <RelationSearchPanel
          v-else
          :search="search"
          :query="query"
          :min-chars="minChars"
          :can-search="canSearch"
          :can-add="canAdd"
          :show-cancel="hasSelection"
          :locked="locked"
          @update:query="onQuery"
          @choose="choose"
          @cancel="closeSearch"
          @create="openDialog('add')"
        />

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

.relation-modal { width: 520px; max-width: 94vw; }
.relation-trigger :deep(input) { cursor: pointer; }

@media (max-width: 599px) {
  .relation-actions { align-items: stretch; width: 100%; margin-left: 0; }
  .relation-actions .row { justify-content: flex-start; }
}
</style>
