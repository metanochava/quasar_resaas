<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="v => emit('update:modelValue', v)">
    <s-modal-card :title="tdc('We found possible matches')" icon="people" width="900px" @close="cancel">
      <s-page-title :title="tdc('We found possible matches')" :active="modelValue" />

      <div class="text-body2 text-grey-7 q-mb-md">
        {{ tdc('We found people already registered that may be the same person you are adding. Review the matches below before creating a new record.') }}
      </div>

      <div class="column q-gutter-md">
        <s-card
          v-for="candidate in candidates"
          :key="candidate.id"
          flat
          bordered
          class="match-candidate-card"
        >
          <q-card-section class="row items-start no-wrap q-gutter-md">
            <q-avatar size="64px" square class="rounded-borders">
              <img v-if="candidate.photo?.url" :src="candidate.photo.url">
              <span v-else class="text-h6">{{ initialsOf(candidate) }}</span>
            </q-avatar>

            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ candidate.full_name || [candidate.name, candidate.surname].filter(Boolean).join(' ') }}
              </div>
              <div v-if="candidate.preferred_name" class="text-caption text-grey-7">
                {{ tdc('Preferred name') }}: {{ candidate.preferred_name }}
              </div>

              <div class="row q-col-gutter-x-md q-mt-xs text-body2">
                <div v-if="candidate.date_of_birth" class="col-auto">
                  <q-icon name="cake" size="16px" class="q-mr-xs" />
                  {{ candidate.date_of_birth }}
                  <span v-if="candidate.age != null" class="text-grey-7">({{ candidate.age }} {{ tdc('years') }})</span>
                </div>
                <div v-if="candidate.email" class="col-auto">
                  <q-icon name="mail" size="16px" class="q-mr-xs" />
                  {{ candidate.email }}
                </div>
                <div v-if="candidate.phone" class="col-auto">
                  <q-icon name="phone" size="16px" class="q-mr-xs" />
                  {{ candidate.phone }}
                </div>
              </div>

              <div v-if="candidate.documents?.length" class="q-mt-xs text-body2">
                <q-icon name="badge" size="16px" class="q-mr-xs" />
                {{ candidate.documents.map(d => `${d.tipo_data?.name || tdc('Document')} ${d.numero}`).join(' · ') }}
              </div>

              <div class="row q-gutter-xs q-mt-sm">
                <q-chip
                  v-for="field in candidate.matched_fields"
                  :key="field"
                  dense
                  square
                  color="positive"
                  text-color="white"
                  icon="check"
                >
                  {{ tdc(matchedFieldLabel(field)) }}
                </q-chip>
              </div>

              <div v-if="expanded[candidate.id]" class="q-mt-sm text-body2 text-grey-8">
                <div v-if="candidate.gender">{{ tdc('Gender') }}: {{ candidate.gender }}</div>
                <div v-if="candidate.marital_status">{{ tdc('Marital status') }}: {{ candidate.marital_status }}</div>
                <div v-if="candidate.nationality">{{ tdc('Nationality') }}: {{ candidate.nationality }}</div>
                <div v-if="candidate.alternative_phone">{{ tdc('Alternative phone') }}: {{ candidate.alternative_phone }}</div>
                <div v-if="candidate.address">
                  {{ tdc('Address') }}:
                  {{ [candidate.address.street, candidate.address.city, candidate.address.country].filter(Boolean).join(', ') }}
                </div>
              </div>

              <s-btn
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                class="q-mt-xs q-px-none"
                :label="expanded[candidate.id] ? tdc('Hide details') : tdc('View details')"
                @click="toggleExpanded(candidate.id)"
              />
            </div>

            <s-btn
              unelevated
              color="primary"
              icon="how_to_reg"
              :label="tdc('Use this person')"
              @click="emit('select', candidate)"
            />
          </q-card-section>
        </s-card>
      </div>

      <template #footer>
        <s-btn flat color="grey-7" :label="tdc('Cancel')" @click="cancel" />
        <q-space />
        <s-btn
          outline
          color="primary"
          icon="person_add"
          :label="tdc('Create new person anyway')"
          @click="emit('create-new')"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { tdc } from '../../services/translation'

// Reusable candidate-review dialog for person_matching_service's
// results (saas/core/services/person_matching_service.py, via
// PersonStore.matchCandidates()) - deliberately generic (just Person
// fields + matched_fields), so any future intake flow beyond
// add_employee (Patient/Student/Customer) can reuse it as-is instead
// of building its own version of the same review step.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  candidates: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'select', 'create-new', 'cancel'])

const expanded = ref({})

function toggleExpanded(id) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

function initialsOf(candidate) {
  const name = candidate.full_name || [candidate.name, candidate.surname].filter(Boolean).join(' ')
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const MATCHED_FIELD_LABELS = {
  document: 'Document matches',
  email: 'Email matches',
  phone: 'Phone matches',
  name_and_birth_date: 'Name and date of birth match'
}

function matchedFieldLabel(field) {
  return MATCHED_FIELD_LABELS[field] || field
}

function cancel() {
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<style scoped>
.match-candidate-card {
  border-radius: 10px;
}
</style>
