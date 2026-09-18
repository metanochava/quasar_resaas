<template>
  <q-page class="q-pa-sm employee-create-page">
    <div v-if="saving" class="flex flex-center q-pa-lg">
      <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
    </div>

    <div v-else class="row q-col-gutter-md">

      <!-- ================================================= -->
      <!-- PHOTO + PERSONAL DATA -->
      <!-- ================================================= -->
      <div class="col-12">
        <s-card flat bordered>
          <q-card-section class="section-header row items-center">
            <q-icon name="badge" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">{{ tdc('Personal data') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">

              <div class="col-12 col-sm-3 col-md-2 flex flex-center">
                <s-upload
                  v-model="Person.form.photo"
                  accept="image/*"
                  :label="tdc('Photo')"
                  class="full-width"
                />
              </div>

              <div class="col-12 col-sm-9 col-md-10">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.name"
                      :label="tdc('First name')"
                      :error="!!Person.errors.name"
                      :error-message="Person.errors.name"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.middle_name"
                      :label="tdc('Middle name')"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.surname"
                      :label="tdc('Surname')"
                      :error="!!Person.errors.surname"
                      :error-message="Person.errors.surname"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.preferred_name"
                      :label="tdc('Preferred name')"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-select
                      v-model="Person.form.gender"
                      emit-value
                      map-options
                      :options="genderOptions"
                      :label="tdc('Gender')"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-date
                      v-model="Person.form.date_of_birth"
                      :label="tdc('Date of birth')"
                      dense outlined
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <s-select
                      v-model="Person.form.marital_status"
                      emit-value
                      map-options
                      :options="maritalStatusOptions"
                      :label="tdc('Marital status')"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.nationality"
                      :label="tdc('Nationality')"
                      dense outlined
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <s-input
                      v-model="Person.form.occupation"
                      :label="tdc('Occupation')"
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
      <div class="col-12 col-md-6">
        <s-card flat bordered class="full-height">
          <q-card-section class="section-header row items-center">
            <q-icon name="contact_phone" size="24px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">{{ tdc('Contacts') }}</div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <s-input
                  v-model="Person.form.email"
                  type="email"
                  :label="tdc('Email')"
                  :error="!!Person.errors.email"
                  :error-message="Person.errors.email"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-input
                  v-model="Person.form.secondary_email"
                  type="email"
                  :label="tdc('Secondary email')"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-input
                  v-model="Person.form.phone"
                  :label="tdc('Phone')"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6">
                <s-input
                  v-model="Person.form.alternative_phone"
                  :label="tdc('Alternative phone')"
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
      <div class="col-12 col-md-6">
        <AddressLocationPicker
          class="full-height"
          :model-value="Person.form.address"
          :card-title="[Person.form.name, Person.form.surname].filter(Boolean).join(' ')"
          @update:model-value="Person.form.address = $event"
        />
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
                <s-input
                  v-model="Employee.form.code"
                  :label="tdc('Employee code')"
                  :hint="tdc('Leave empty to auto-generate')"
                  :error="!!Employee.errors.code"
                  :error-message="Employee.errors.code"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-date
                  v-model="Employee.form.hire_date"
                  :label="tdc('Hire date')"
                  :error="!!Employee.errors.hire_date"
                  :error-message="Employee.errors.hire_date"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="Employee.form.employment_status"
                  emit-value
                  map-options
                  :options="employmentStatusOptions"
                  :label="tdc('Employment status')"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-select
                  v-model="Employee.form.employment_type"
                  emit-value
                  map-options
                  :options="employmentTypeOptions"
                  :label="tdc('Employment type')"
                  dense outlined
                />
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <s-input
                  v-model="Employee.form.work_email"
                  type="email"
                  :label="tdc('Work email')"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-input
                  v-model="Employee.form.work_phone"
                  :label="tdc('Work phone')"
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
                <s-input v-model="contact.name" :label="tdc('Name')" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-input v-model="contact.relationship" :label="tdc('Relationship')" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-input v-model="contact.phone" :label="tdc('Phone')" dense outlined />
              </div>
              <div class="col-12 col-sm-6 col-md-2">
                <s-input v-model="contact.email" type="email" :label="tdc('Email')" dense outlined />
              </div>

              <div class="col-6 col-sm-3 col-md-1 flex flex-center">
                <s-switch v-model="contact.is_primary" :label="tdc('Primary')" dense />
              </div>
              <div class="col-6 col-sm-3 col-md-1 flex flex-center">
                <s-switch v-model="contact.is_emergency" :label="tdc('Emergency')" dense />
              </div>

              <div class="col-12 col-sm-9">
                <s-input v-model="contact.notes" :label="tdc('Notes')" dense outlined />
              </div>
              <div class="col-12 col-sm-3 flex flex-center justify-end">
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
            <s-btn flat color="grey-7" :label="tdc('Cancel')" @click="router.back()" />
            <s-btn
              unelevated
              color="primary"
              icon="save"
              :loading="saving"
              :label="tdc('Save employee')"
              @click="submit"
            />
          </div>
        </s-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { usePersonStore } from '../../../stores/PersonStore'
import { usePersonContactStore } from '../../../stores/PersonContactStore'
import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import { useJobPositionStore } from '../../../stores/JobPositionStore'
import { useJobGradeStore } from '../../../stores/JobGradeStore'

import AddressLocationPicker from '../../../components/address/AddressLocationPicker.vue'
import { tdc } from '../../../services/translation'
import { Alert } from '../../../boot/alerts'

// Manually composed page (no FormTwo/AutoForm/schema-driven generation) -
// Employee.person is a plain write-only FK (hr/serializers/employee.py),
// with no nested-create support server-side, so this orchestrates THREE
// separate BaseStore creates (Person, then each PersonContact, then
// Employee) in sequence, reusing each store's own create()/update() for
// every mechanism (FormData/files, loading, error parsing, tenant
// injection) instead of reimplementing any of it here - this file only
// owns section layout and the create/create/create sequencing itself.
const router = useRouter()

const Person = usePersonStore()
const Employee = useEmployeeStore()
const JobPosition = useJobPositionStore()
const JobGrade = useJobGradeStore()
// PersonContact rows don't exist until Person does, so they can't live
// on the store's own .form (that's a single record) - staged locally as
// plain objects and created one by one, through the store, once the
// owning Person's real id is known.
const PersonContact = usePersonContactStore()

const saving = ref(false)
let contactKeySeq = 0
const contacts = ref([])

function addContact() {
  contacts.value.push({
    _key: ++contactKeySeq,
    name: '',
    relationship: '',
    phone: '',
    email: '',
    is_primary: contacts.value.length === 0,
    is_emergency: false,
    notes: ''
  })
}

function removeContact(index) {
  contacts.value.splice(index, 1)
}

// ---------------- STATIC OPTIONS (mirror the model's own choices) ----------------
const genderOptions = [
  { label: tdc('Masculine'), value: 'M' },
  { label: tdc('Feminine'), value: 'F' },
  { label: tdc('Others'), value: 'O' }
]

const maritalStatusOptions = [
  { label: tdc('Single'), value: 'single' },
  { label: tdc('Married'), value: 'married' },
  { label: tdc('Divorced'), value: 'divorced' },
  { label: tdc('Widowed'), value: 'widowed' },
  { label: tdc('Other'), value: 'other' }
]

const employmentStatusOptions = [
  { label: tdc('Active'), value: 'active' },
  { label: tdc('Probation'), value: 'probation' },
  { label: tdc('Suspended'), value: 'suspended' },
  { label: tdc('Terminated'), value: 'terminated' },
  { label: tdc('Resigned'), value: 'resigned' },
  { label: tdc('Retired'), value: 'retired' }
]

const employmentTypeOptions = [
  { label: tdc('Full Time'), value: 'full_time' },
  { label: tdc('Part Time'), value: 'part_time' },
  { label: tdc('Contractor'), value: 'contractor' },
  { label: tdc('Intern'), value: 'intern' }
]

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

// ---------------- SUBMIT ----------------
async function submit() {
  saving.value = true

  try {
    // 1. Person - photo (a File) is sent in a SEPARATE update() right
    // after create(), never in the same request as `address` (a nested
    // object): BaseStore's multipart path (base/base_store.js's
    // buildRequestPayload/toFormData) only knows how to append files
    // and plain scalars/arrays, not stringify a nested object - mixing
    // the two would send address as the literal string "[object
    // Object]". Splitting the photo into its own plain-JSON-free
    // request sidesteps that instead of changing that shared utility.
    const photoFile = Person.form.photo instanceof File ? Person.form.photo : null
    if (photoFile) {
      const { photo, ...rest } = Person.form
      Person.form = rest
    }

    const person = await Person.create()

    if (photoFile) {
      Person.form = { id: person.id, photo: photoFile }
      await Person.update()
    }

    // 2. Emergency/other contacts - created one by one against the
    // now-real Person id.
    for (const contact of contacts.value) {
      if (!contact.name?.trim()) continue

      const { _key, ...payload } = contact
      PersonContact.form = { ...payload, person: person.id }
      await PersonContact.create()
    }

    // 3. Employee itself, linked to the Person just created.
    Employee.form = { ...Employee.form, person: person.id }
    const employee = await Employee.create()

    router.push({ name: 'view_employee', params: { id: employee.id } })
  } catch (error) {
    // Person/Employee.errors already got populated by create()'s own
    // catch (parseFieldErrors) - Alert() surfaces the same toast every
    // other save action in the app already uses on failure.
    Alert(error?.response)
  } finally {
    saving.value = false
  }
}

// ---------------- INIT ----------------
onMounted(async () => {
  Person.resetForm?.()
  Employee.resetForm?.()

  await Promise.all([
    Person.init(),
    Employee.init(),
    JobPosition.init(),
    JobGrade.init()
  ])

  // Fresh, blank forms again - .init() above calls loadData(), whose
  // resulting list has nothing to do with the form being filled in here.
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
