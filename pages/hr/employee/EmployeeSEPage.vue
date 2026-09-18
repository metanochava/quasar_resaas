<template>
  <q-page class="q-pa-sm employee-create-page">
    <q-form ref="formRef" class="row q-col-gutter-md" @submit.prevent="save">

      <!-- ================================================= -->
      <!-- SELECTED EXISTING PERSON SUMMARY -->
      <!-- ================================================= -->
      <div v-if="selectedPerson" class="col-12">
        <s-card flat bordered class="bg-primary text-white">
          <q-card-section class="row items-center no-wrap q-gutter-md">
            <q-avatar size="56px" square class="rounded-borders">
              <img v-if="selectedPerson.photo?.url" :src="selectedPerson.photo.url">
              <q-icon v-else name="person" size="32px" />
            </q-avatar>

            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ tdc('Using existing person') }}: {{ selectedPerson.full_name }}
              </div>
              <div class="text-caption">
                {{ [selectedPerson.email, selectedPerson.phone].filter(Boolean).join(' · ') }}
              </div>
            </div>

            <s-btn
              flat
              no-caps
              icon="close"
              color="white"
              :label="tdc('Change')"
              @click="clearSelectedPerson"
            />
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- PHOTO + PERSONAL DATA -->
      <!-- ================================================= -->
      <div v-if="!selectedPerson" class="col-12">
        <s-card flat bordered>
          <q-card-section class="section-header row items-center">
            <q-icon name="badge" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">{{ tdc('Personal data') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">

              <div class="col-12 col-sm-3 col-md-2 flex flex-center">
                <s-field
                  v-model="Person.form.photo"
                  :field="fieldOf(Person, 'photo')"
                  :label="tdc('Photo')"
                  class="full-width"
                />
              </div>

              <div class="col-12 col-sm-9 col-md-10">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.name"
                      :field="fieldOf(Person, 'name')"
                      :label="tdc('First name')"
                      :error="!!Person.errors.name"
                      :error-message="Person.errors.name"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.surname"
                      :field="fieldOf(Person, 'surname')"
                      :label="tdc('Surname')"
                      :error="!!Person.errors.surname"
                      :error-message="Person.errors.surname"
                      :filled="false"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.preferred_name"
                      :field="fieldOf(Person, 'preferred_name')"
                      :label="tdc('Preferred name')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.gender"
                      :field="fieldOf(Person, 'gender')"
                      :label="tdc('Gender')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.date_of_birth"
                      :field="fieldOf(Person, 'date_of_birth')"
                      :label="tdc('Date of birth')"
                      :filled="false"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.marital_status"
                      :field="fieldOf(Person, 'marital_status')"
                      :label="tdc('Marital status')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.nationality"
                      :field="fieldOf(Person, 'nationality')"
                      :label="tdc('Nationality')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.country_of_birth"
                      :field="fieldOf(Person, 'country_of_birth')"
                      :label="tdc('Country of birth')"
                      :filled="false"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.place_of_birth"
                      :field="fieldOf(Person, 'place_of_birth')"
                      :label="tdc('Place of birth')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.occupation"
                      :field="fieldOf(Person, 'occupation')"
                      :label="tdc('Occupation')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.preferred_language"
                      :field="fieldOf(Person, 'preferred_language')"
                      :label="tdc('Preferred language')"
                      :filled="false"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-field
                      v-model="Person.form.timezone"
                      :field="fieldOf(Person, 'timezone')"
                      :label="tdc('Timezone')"
                      :filled="false"
                      dense outlined
                    />
                  </div>
                </div>
              </div>

            </div>
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- CONTACTS -->
      <!-- ================================================= -->
      <div v-if="!selectedPerson" class="col-12 col-md-6">
        <s-card flat bordered class="full-height">
          <q-card-section class="section-header row items-center">
            <q-icon name="contact_phone" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">{{ tdc('Contacts') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <s-field
                  v-model="Person.form.email"
                  :field="fieldOf(Person, 'email')"
                  type="email"
                  :label="tdc('Email')"
                  :error="!!Person.errors.email"
                  :error-message="Person.errors.email"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-field
                  v-model="Person.form.secondary_email"
                  :field="fieldOf(Person, 'secondary_email')"
                  type="email"
                  :label="tdc('Secondary email')"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-field
                  v-model="Person.form.phone"
                  :field="fieldOf(Person, 'phone')"
                  :label="tdc('Phone')"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-field
                  v-model="Person.form.alternative_phone"
                  :field="fieldOf(Person, 'alternative_phone')"
                  :label="tdc('Alternative phone')"
                  :filled="false"
                  dense outlined
                />
              </div>
            </div>
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- ADDRESS -->
      <!-- ================================================= -->
      <div v-if="!selectedPerson" class="col-12 col-md-6">
        <AddressLocationPicker
          class="full-height"
          :model-value="Person.form.address"
          :card-title="[Person.form.name, Person.form.surname].filter(Boolean).join(' ')"
          @update:model-value="Person.form.address = $event"
        />
      </div>

      <!-- ================================================= -->
      <!-- DOCUMENTS -->
      <!-- ================================================= -->
      <div class="col-12">
        <s-card flat bordered>
          <q-card-section class="section-header row items-center justify-between">
            <div class="row items-center">
              <q-icon name="badge" size="24px" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">{{ tdc('Documents') }}</div>
            </div>
            <s-btn
              flat
              dense
              icon="add"
              color="primary"
              :label="tdc('Add document')"
              @click="addDocument"
            />
          </q-card-section>

          <q-separator />

          <!-- Existing documents (read-only) - the matched person's own
               documents, from PersonAPIView.match's own response - never
               recreated, only shown so the admin can see what's already
               on file before adding anything new. -->
          <q-card-section v-if="selectedPerson?.documents?.length" class="q-pb-none">
            <div class="text-caption text-grey-7 q-mb-sm">{{ tdc('Already on file') }}</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="doc in selectedPerson.documents"
                :key="doc.id"
                square
                dense
                icon="badge"
                color="grey-3"
                text-color="dark"
              >
                {{ doc.tipo_data?.name || tdc('Document') }} · {{ doc.numero }}
              </q-chip>
            </div>
          </q-card-section>

          <q-card-section v-if="!documents.length" class="text-caption text-grey-6">
            {{ tdc('No documents added yet.') }}
          </q-card-section>

          <q-card-section v-for="(doc, index) in documents" :key="doc._key">
            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="doc.tipo"
                  emit-value
                  map-options
                  :options="documentTypeOptions"
                  :label="tdc('Document type')"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field v-model="doc.numero" :field="fieldOf(Document, 'numero')" :label="tdc('Number')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-field v-model="doc.data_emissao" :field="fieldOf(Document, 'data_emissao')" :label="tdc('Issue date')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-field v-model="doc.data_validade" :field="fieldOf(Document, 'data_validade')" :label="tdc('Expiry date')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-8 col-md-1">
                <s-field v-model="doc.arquivo" :field="fieldOf(Document, 'arquivo')" :label="tdc('File')" />
              </div>
              <div class="col-12 col-sm-4 col-md-1 flex flex-center justify-end">
                <s-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="removeDocument(index)"
                >
                  <s-tooltip>{{ tdc('Remove document') }}</s-tooltip>
                </s-btn>
              </div>
            </div>

            <q-separator v-if="index < documents.length - 1" class="q-mt-md" />
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- PROFESSIONAL DATA -->
      <!-- ================================================= -->
      <div class="col-12">
        <s-card flat bordered>
          <q-card-section class="section-header row items-center">
            <q-icon name="work" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">{{ tdc('Professional data') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.code"
                  :field="fieldOf(Employee, 'code')"
                  :label="tdc('Employee code')"
                  :hint="tdc('Leave empty to auto-generate')"
                  :error="!!Employee.errors.code"
                  :error-message="Employee.errors.code"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.hire_date"
                  :field="fieldOf(Employee, 'hire_date')"
                  :label="tdc('Hire date')"
                  :error="!!Employee.errors.hire_date"
                  :error-message="Employee.errors.hire_date"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.employment_status"
                  :field="fieldOf(Employee, 'employment_status')"
                  :label="tdc('Employment status')"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.employment_type"
                  :field="fieldOf(Employee, 'employment_type')"
                  :label="tdc('Employment type')"
                  :filled="false"
                  dense outlined
                />
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.work_email"
                  :field="fieldOf(Employee, 'work_email')"
                  type="email"
                  :label="tdc('Work email')"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.work_phone"
                  :field="fieldOf(Employee, 'work_phone')"
                  :label="tdc('Work phone')"
                  :filled="false"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="Employee.form.position"
                  emit-value
                  map-options
                  :options="positionOptions"
                  :label="tdc('Job position')"
                  clearable
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="Employee.form.job_grade"
                  emit-value
                  map-options
                  :options="jobGradeOptions"
                  :label="tdc('Job grade')"
                  clearable
                  dense outlined
                />
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="Employee.form.manager"
                  emit-value
                  map-options
                  :options="managerOptions"
                  :label="tdc('Manager')"
                  clearable
                  dense outlined
                />
              </div>
            </div>
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- EMERGENCY CONTACTS -->
      <!-- ================================================= -->
      <div class="col-12">
        <s-card flat bordered>
          <q-card-section class="section-header row items-center justify-between">
            <div class="row items-center">
              <q-icon name="emergency" size="24px" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-bold">{{ tdc('Emergency contacts') }}</div>
            </div>
            <s-btn
              flat
              dense
              icon="add"
              color="primary"
              :label="tdc('Add contact')"
              @click="addContact"
            />
          </q-card-section>

          <q-separator />

          <q-card-section v-if="!contacts.length" class="text-caption text-grey-6">
            {{ tdc('No emergency contacts added yet.') }}
          </q-card-section>

          <q-card-section v-for="(contact, index) in contacts" :key="contact._key">
            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-sm-6 col-md-3">
                <s-field v-model="contact.name" :field="fieldOf(PersonContact, 'name')" :label="tdc('Name')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field v-model="contact.relationship" :field="fieldOf(PersonContact, 'relationship')" :label="tdc('Relationship')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-field v-model="contact.phone" :field="fieldOf(PersonContact, 'phone')" :label="tdc('Phone')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-field v-model="contact.alternative_phone" :field="fieldOf(PersonContact, 'alternative_phone')" :label="tdc('Alternative phone')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-field v-model="contact.email" :field="fieldOf(PersonContact, 'email')" type="email" :label="tdc('Email')" :filled="false" dense outlined />
              </div>
              <div class="col-12 col-sm-8">
                <s-input v-model="contact.notes" :label="tdc('Notes')" dense outlined />
              </div>
              <div class="col-6 col-sm-2 col-md-1 flex flex-center">
                <s-field v-model="contact.is_primary" :field="fieldOf(PersonContact, 'is_primary')" :label="tdc('Primary')" dense />
              </div>
              <div class="col-6 col-sm-2 col-md-1 flex flex-center">
                <s-field v-model="contact.is_emergency" :field="fieldOf(PersonContact, 'is_emergency')" :label="tdc('Emergency')" dense />
              </div>
              <div class="col-12 col-sm-2 flex flex-center justify-end">
                <s-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  @click="removeContact(index)"
                >
                  <s-tooltip>{{ tdc('Remove contact') }}</s-tooltip>
                </s-btn>
              </div>
            </div>

            <q-separator v-if="index < contacts.length - 1" class="q-mt-md" />
          </q-card-section>
        </s-card>
      </div>

      <!-- ================================================= -->
      <!-- ACTIONS -->
      <!-- ================================================= -->
      <div class="col-12">
        <s-card flat class="q-pa-sm">
          <div class="row justify-end q-gutter-sm">
            <s-btn flat color="grey-7" :label="tdc('Cancel')" :disable="saving" @click="cancel" />
            <s-btn
              type="submit"
              unelevated
              color="primary"
              icon="save"
              :loading="saving"
              :disable="saving"
              :label="tdc('Save employee')"
            />
          </div>
        </s-card>
      </div>

    </q-form>

    <PersonMatchDialog
      v-model="matchDialogOpen"
      :candidates="matchCandidatesList"
      @select="onMatchSelect"
      @create-new="onMatchCreateNew"
      @cancel="onMatchCancel"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

import { usePersonStore } from '../../../stores/PersonStore'
import { usePersonContactStore } from '../../../stores/PersonContactStore'
import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import { useJobPositionStore } from '../../../stores/JobPositionStore'
import { useJobGradeStore } from '../../../stores/JobGradeStore'
import { useDocumentTypeStore } from '../../../stores/DocumentTypeStore'
import { useDocumentStore } from '../../../stores/DocumentStore'

import AddressLocationPicker from '../../../components/address/AddressLocationPicker.vue'
import PersonMatchDialog from '../../../components/person/PersonMatchDialog.vue'
import { tdc } from '../../../services/translation'
import { Alert } from '../../../boot/alerts'

// Manually composed page (no FormTwo/AutoForm/schema-driven generation
// as the PRIMARY layout) - still built entirely on top of BaseStore/
// the stores below for load/create/relations/FormData/loading/errors,
// plus the schema (via fieldOf()) for widget/choice/rule metadata.
// The one genuinely new mechanism is the atomic Employee.register()
// action (hr/services/employee_registration_service.py) - creating
// Person, its Documents/PersonContacts and the Employee itself one
// request at a time could never be atomic, so this compound business
// operation gets its own backend action instead of stretching
// BaseStore's generic create() to fit a shape (a whole multi-model
// transaction, with per-item files) it was never meant for.
//
// Duplicate-person detection reuses the same reasoning: matching lives
// in saas.core.services.person_matching_service (backend) and
// PersonMatchDialog.vue (frontend) precisely so add_employee doesn't
// own that logic - a future Patient/Student/Customer intake flow can
// call the exact same match action and reuse the exact same dialog.
const router = useRouter()
const $q = useQuasar()

const Person = usePersonStore()
const Employee = useEmployeeStore()
const JobPosition = useJobPositionStore()
const JobGrade = useJobGradeStore()
const DocumentType = useDocumentTypeStore()
// PersonContact/Document rows don't exist until Person does, so they
// can't live on either store's own .form (a single record) - staged
// locally as plain objects, only ever sent through Employee.register()
// once the owning Person (new or reused) is known, never created one
// by one against a fake existing/mid-flow Person id.
const PersonContact = usePersonContactStore()
const Document = useDocumentStore()

const formRef = ref(null)
const saving = ref(false)

// ---------------- EMERGENCY CONTACTS ----------------
let contactKeySeq = 0
const contacts = ref([])

function addContact() {
  contacts.value.push({
    _key: ++contactKeySeq,
    name: '',
    relationship: '',
    phone: '',
    alternative_phone: '',
    email: '',
    is_primary: contacts.value.length === 0,
    is_emergency: false,
    notes: ''
  })
}

function removeContact(index) {
  contacts.value.splice(index, 1)
}

// ---------------- DOCUMENTS ----------------
let documentKeySeq = 0
const documents = ref([])

function addDocument() {
  documents.value.push({
    _key: ++documentKeySeq,
    tipo: null,
    numero: '',
    data_emissao: null,
    data_validade: null,
    arquivo: null
  })
}

function removeDocument(index) {
  documents.value.splice(index, 1)
}

const documentTypeOptions = computed(() =>
  (DocumentType.rows || []).map(r => ({ label: r.label || r.name, value: r.id }))
)

// ---------------- SCHEMA FIELD LOOKUP ----------------
// Person/Employee/PersonContact/Document.fields (populated by each
// store's own loadSchema() -> buildFormFromSchema(), see
// utils/autoForm.js) already carry the real component/props/rules
// resolved from the backend model (component guessed from field type,
// choices turned into translated options, file accept/multiple/
// maxSize, validators...) - s-field (FieldComponent.vue) uses that to
// render the right widget on its own instead of this page hardcoding
// which s-* component/options go with which field. Falls back to a
// plain text field before the schema has loaded (or for a name with
// no matching field), same category of fallback FieldComponent.vue
// already has for a hand-built field.
function fieldOf(store, name) {
  return (store.fields || []).find(f => f.name === name) || { name, type: 'CharField', label: name }
}

// ---------------- RELATION OPTIONS ----------------
const positionOptions = computed(() =>
  (JobPosition.rows || []).map(r => ({ label: r.label || r.name || r.code, value: r.id }))
)

const jobGradeOptions = computed(() =>
  (JobGrade.rows || []).map(r => ({ label: r.label || r.name || r.code, value: r.id }))
)

const managerOptions = computed(() =>
  (Employee.rows || []).map(r => ({ label: r.label || String(r), value: r.id }))
)

// ---------------- PERSON MATCHING ----------------
const matchDialogOpen = ref(false)
const matchCandidatesList = ref([])
const selectedPerson = ref(null)

// True once the user has explicitly resolved the match step for THIS
// person (picked a candidate, or confirmed "create new person
// anyway") - later Save clicks in the same visit skip matching again,
// so confirming a choice once doesn't reopen the same dialog on every
// click. Edits are trusted once resolved; use "Change" (the summary
// card above) to go back and re-match from scratch.
const matchResolved = ref(false)

function clearSelectedPerson() {
  selectedPerson.value = null
  matchResolved.value = false
}

let resolveMatchChoice = null

function waitForMatchChoice() {
  return new Promise(resolve => { resolveMatchChoice = resolve })
}

function onMatchSelect(candidate) {
  selectedPerson.value = candidate
  matchResolved.value = true
  matchDialogOpen.value = false
  resolveMatchChoice?.('use-existing')
}

function onMatchCreateNew() {
  matchResolved.value = true
  matchDialogOpen.value = false
  resolveMatchChoice?.('create-new')
}

function onMatchCancel() {
  resolveMatchChoice?.('cancel')
}

function buildMatchPayload() {
  return {
    email: Person.form.email,
    phone: Person.form.phone,
    alternative_phone: Person.form.alternative_phone,
    name: Person.form.name,
    middle_name: Person.form.middle_name,
    surname: Person.form.surname,
    date_of_birth: Person.form.date_of_birth,
    documents: documents.value
      .filter(d => d.tipo && d.numero)
      .map(d => ({ tipo: d.tipo, numero: d.numero }))
  }
}

// ---------------- CANCEL (confirm before losing filled data) ----------------
function hasUnsavedData() {
  return !!(
    selectedPerson.value ||
    Person.form.name || Person.form.surname || Person.form.email || Person.form.phone ||
    documents.value.length || contacts.value.some(c => c.name?.trim()) ||
    Employee.form.hire_date
  )
}

function cancel() {
  if (!hasUnsavedData()) {
    router.back()
    return
  }

  $q.dialog({
    title: tdc('Discard changes?'),
    message: tdc('The employee form has unsaved information. Are you sure you want to leave?'),
    persistent: true,
    ok: { label: tdc('Discard'), color: 'negative', flat: true },
    cancel: { label: tdc('Keep editing'), flat: true }
  }).onOk(() => router.back())
}

// ---------------- SAVE ----------------
function buildPersonData() {
  const { photo, id, ...rest } = Person.form
  return rest
}

async function save() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  try {
    if (!selectedPerson.value && !matchResolved.value) {
      saving.value = true
      const candidates = await Person.matchCandidates(buildMatchPayload())
      saving.value = false

      if (candidates.length) {
        matchCandidatesList.value = candidates
        matchDialogOpen.value = true

        const choice = await waitForMatchChoice()
        if (choice === 'cancel') return
      } else {
        matchResolved.value = true
      }
    }

    saving.value = true

    const employee = await Employee.register({
      personId: selectedPerson.value?.id || null,
      personData: selectedPerson.value ? null : buildPersonData(),
      photo: selectedPerson.value ? null : (Person.form.photo instanceof File ? Person.form.photo : null),
      documents: documents.value
        .filter(d => d.tipo && d.numero)
        .map(d => ({
          tipo: d.tipo,
          numero: d.numero,
          data_emissao: d.data_emissao || null,
          data_validade: d.data_validade || null,
          arquivo: d.arquivo instanceof File ? d.arquivo : null
        })),
      contacts: contacts.value
        .filter(c => c.name?.trim())
        .map(({ _key, ...contact }) => contact),
      employeeData: { ...Employee.form }
    })

    router.push({ name: 'view_employee', params: { id: employee.id } })
  } catch (error) {
    const status = error?.response?.status
    const existingEmployeeId = error?.response?.data?.existing_employee_id

    if (status === 409 && existingEmployeeId) {
      $q.notify({
        type: 'warning',
        timeout: 10000,
        message: tdc('This person is already an employee in this branch.'),
        actions: [
          {
            label: tdc('View employee'),
            color: 'white',
            handler: () => router.push({ name: 'view_employee', params: { id: existingEmployeeId } })
          },
          { icon: 'close', color: 'white' }
        ]
      })
    } else {
      // Person/Employee.errors already got populated by create()'s own
      // catch (parseFieldErrors) elsewhere in the app - Alert() surfaces
      // the same toast every other save action already uses on failure,
      // and already flattens a nested {person: {...}, employee: {...}}
      // error body (register()'s own shape) into one readable message.
      Alert(error?.response)
    }
  } finally {
    saving.value = false
  }
}

// ---------------- INIT ----------------
onMounted(async () => {
  Person.resetForm?.()
  Employee.resetForm?.()

  await Promise.all([
    // Only the schema is needed here (for fieldOf()'s component/props/
    // rules lookup) - .init() also runs loadData(), fetching the full
    // row list and requiring list_person/list_personcontact/
    // list_document, a permission this page has no actual use for
    // (nothing here ever shows a Person/PersonContact/Document list)
    // and a role allowed to add employees may well not hold.
    // Employee/JobPosition/JobGrade/DocumentType DO need their .rows
    // (position/job_grade/manager/document-type option lists), so
    // those stay on the full init().
    Person.loadSchemaOnce(),
    PersonContact.loadSchemaOnce(),
    Document.loadSchemaOnce(),
    Employee.init(),
    JobPosition.init(),
    JobGrade.init(),
    DocumentType.init()
  ])

  // Fresh, blank forms again - Employee.init() above also calls
  // loadData(), whose resulting list has nothing to do with the form
  // being filled in here.
  Person.resetForm?.()
  Employee.resetForm?.()

  addContact()
})
</script>

<style scoped>
.employee-create-page .section-header {
  padding-bottom: 8px;
}
</style>
