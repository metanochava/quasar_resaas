<template>
  <q-page class="q-pa-sm employee-create-page">
    <q-form ref="formRef" class="row q-col-gutter-md" @submit.prevent="save">

      <!-- Person half: summary of a matched person / personal data /
           contacts / address / documents / emergency contacts, plus the
           duplicate-match dialog - shared with add_paciente. -->
      <div class="col-12">
        <s-person-intake :intake="intake" />
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
                  :hint="isEditMode ? undefined : tdc('Generated automatically')"
                  :error="!!Employee.errors.code"
                  :error-message="Employee.errors.code"
                  :filled="false"
                  readonly
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
                <s-field
                  v-model="Employee.form.position"
                  :field="fieldOf(Employee, 'position')"
                  :label="tdc('Job position')"
                  :disable="isEditMode"
                  :hint="isEditMode ? tdc('Use Promotion/Transfer to change this') : undefined"
                  dense outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.job_grade"
                  :field="fieldOf(Employee, 'job_grade')"
                  :label="tdc('Job grade')"
                  :disable="isEditMode"
                  :hint="isEditMode ? tdc('Use Promotion/Transfer to change this') : undefined"
                  dense outlined
                />
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <s-field
                  v-model="Employee.form.manager"
                  :field="fieldOf(Employee, 'manager')"
                  :label="tdc('Manager')"
                  dense outlined
                />
              </div>
            </div>
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
              :label="isEditMode ? tdc('Save changes') : tdc('Save employee')"
            />
          </div>
        </s-card>
      </div>

    </q-form>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

import { useEmployeeStore } from '../../../stores/EmployeeStore.js'
import { toRelationOption } from '../../../utils/autoForm'
import { usePersonIntake } from '../../../composables/usePersonIntake'
import { buildWritePayload, updateWithPayload } from '../../../utils/payload'
import { tdc } from '../../../services/translation'
import { Alert } from '../../../boot/alerts'

// The Person half (personal data, contacts, address, documents, emergency
// contacts, duplicate matching, edit load/diff-save) is the shared
// usePersonIntake() + <s-person-intake> - add_paciente uses the very same
// pair. Only what belongs to an EMPLOYEE lives here: professional data,
// Employee.register() on create (atomic Person+documents+contacts+
// Employee, hr/services/employee_registration_service.py) and a plain
// PATCH of the Employee on edit.
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const intake = usePersonIntake()
const { Person } = intake

const Employee = useEmployeeStore()

const formRef = ref(null)
const saving = ref(false)

// /change_employee/:id and /add_employee route to this same page
// (employeeRoute.js) - route.params.id is the only thing that tells the
// two apart.
const employeeId = computed(() => route.params.id || null)
const isEditMode = computed(() => !!employeeId.value)

function fieldOf(store, name) {
  return intake.fieldOf(store, name)
}

// ---------------- CANCEL ----------------
function hasUnsavedData() {
  return intake.hasUnsavedData() || !!Employee.form.hire_date
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
async function saveNew() {
  const outcome = await intake.resolveMatch()
  if (outcome === 'cancel') return

  saving.value = true

  const employee = await Employee.register({
    ...intake.registrationPayload(),
    // code is never client-supplied - EmployeeNumberService generates it
    // {label, value} relation options -> plain ids, read-only extras out
    employeeData: buildWritePayload(Employee.form, Employee.fields, { exclude: ['code'] })
  })

  router.push({ name: 'view_employee', params: { id: employee.id } })
}

// position/job_grade never leave the client on an update:
// EmployeeAPIView.update() rejects the whole PATCH if either key is even
// PRESENT (they only change through apply_promotion/apply_transfer -
// hr/views/employee.py's LOCKED_ON_UPDATE_FIELDS). code is generated.
async function saveEdit() {
  saving.value = true

  await intake.saveExisting()

  await updateWithPayload(
    Employee,
    buildWritePayload(Employee.form, Employee.fields, { exclude: ['position', 'job_grade', 'code'] })
  )

  router.push({ name: 'view_employee', params: { id: employeeId.value } })
}

async function save() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  try {
    if (isEditMode.value) await saveEdit()
    else await saveNew()
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
      Alert(error?.response)
    }
  } finally {
    saving.value = false
  }
}

// ---------------- INIT ----------------
// change_employee only - loads the existing Employee/Person/documents/
// contacts so editing never starts from the same blank form add_employee
// does (and save() PATCHes the real rows instead of registering a
// duplicate).
async function loadForEdit() {
  const employee = await Employee.getById(employeeId.value, { force: true })

  // position/job_grade/manager are write_only on EmployeeSerializer - a
  // plain GET only returns their *_data companions, so the id is lifted
  // back out as {label, value} options for the relation selects (the
  // s-select the schema builds for a ForeignKey works on option objects).
  const asOption = (record) => (record ? toRelationOption(record) : null)

  Employee.form.position = asOption(employee.position_data)
  Employee.form.job_grade = asOption(employee.job_grade_data)
  Employee.form.manager = asOption(employee.manager_data)

  await intake.loadExisting(employee.person_data || {})
}

onMounted(async () => {
  Employee.resetForm?.()
  intake.reset({ withBlankContact: !isEditMode.value })

  await Promise.all([
    intake.init(),
    // Only the schema: the relation selects (position/job grade/manager)
    // search the API themselves and carry the add/edit/view menu from
    // the schema's relation_config - no option lists to preload.
    Employee.loadSchemaOnce()
  ])

  if (isEditMode.value) {
    await loadForEdit()
    return
  }

  Person.resetForm?.()
  Employee.resetForm?.()
})

// Vue Router reuses this component instance between change_employee/A ->
// change_employee/B - onMounted only fires once.
watch(() => route.params.id, async (id) => {
  if (id) await loadForEdit()
})
</script>

<style scoped>
.employee-create-page .section-header {
  padding-bottom: 8px;
}
</style>
