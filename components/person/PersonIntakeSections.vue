<template>
  <div class="row q-col-gutter-md person-intake">
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

              <div class="col-6 col-sm-2 col-md-1 ">
                <s-field v-model="contact.is_primary" :field="fieldOf(PersonContact, 'is_primary')" :label="tdc('Primary')" dense />
              </div>
              <div class="col-6 col-sm-2 col-md-1 ">
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


    <PersonMatchDialog
      v-model="matchDialogOpen"
      :candidates="matchCandidatesList"
      @select="onMatchSelect"
      @create-new="onMatchCreateNew"
      @cancel="onMatchCancel"
    />
  </div>
</template>

<script setup>
import { tdc } from '../../services/translation'
import AddressLocationPicker from '../address/AddressLocationPicker.vue'
import PersonMatchDialog from './PersonMatchDialog.vue'

// Presentational half of usePersonIntake(): binds the Personal data /
// Contacts / Address / Documents / Emergency contacts sections to the
// composable's state, and owns the duplicate-match dialog. The business
// page (add_employee, add_paciente, ...) keeps everything specific to what
// it registers the Person as. `intake` is the object usePersonIntake()
// returned - destructured once so refs unwrap in the template.
const props = defineProps({
  intake: { type: Object, required: true }
})

const {
  Person, PersonContact, Document,
  contacts, documents, selectedPerson,
  matchDialogOpen, matchCandidatesList,
  documentTypeOptions,
  fieldOf,
  addContact, removeContact, addDocument, removeDocument,
  clearSelectedPerson,
  onMatchSelect, onMatchCreateNew, onMatchCancel
} = props.intake
</script>

<style scoped>
.person-intake .section-header {
  padding-bottom: 8px;
}
</style>
