<template>

  <div>

    <!-- =====================================
        SEARCH
    ====================================== -->

    <div class="row no-wrap items-start">

        <!-- INPUT -->
        <q-input
            v-model="Person.search"
            outlined
            dense
            clearable
            debounce="500"
            class="col"
            label="Pesquisar pessoa"
            @update:model-value="doSearch"
        >

            <template #prepend>

            <q-icon name="search" />

            </template>

        </q-input>

        <!-- BUTTON -->
        <q-btn
            v-if="
              Person.search &&
              !Person.rows.length
            "
            color="primary"
            icon="add"
            label="Criar"
            class="q-ml-sm"
            unelevated
            @click="createNew"
        />

    </div>

    <!-- =====================================
        LOADING
    ====================================== -->

    <div
      v-if="Person.loading"
      class="flex flex-center q-pa-lg"
    >

      <q-spinner
        color="primary"
        size="35px"
      />

    </div>

    <!-- =====================================
        RESULTS
    ====================================== -->

    <div
      v-if="
        Person.search &&
        Person.rows.length
        
      "
      class="q-mt-md"
    >

      <PersonCard
        v-for="person in Person.rows"
        :key="person.id"
        :person="person"
        class="q-mb-sm"
        @select="selectPerson"
      />

    </div>

    <!-- =====================================
        EMPTY
    ====================================== -->

    <div
      v-if="
        Person.search &&
        !Person.rows.length
      "
      class="q-mt-md text-grey text-caption"
    >

      Nenhuma pessoa encontrada

    </div>

    <!-- =====================================
        CREATE PERSON DIALOG
    ====================================== -->

    <q-dialog
      v-model="showCreateDialog"
      persistent
    >

      <q-card
        style="width: 900px; max-width: 95vw;"
        class="rounded-borders"
      >

        <!-- HEADER -->
        <q-card-section
          class="row items-center bg-primary text-white"
        >

          <div class="text-h6">

            Criar Pessoa

          </div>

          <q-space />

          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />

        </q-card-section>

        <!-- FORM -->
        <q-card-section>

            <Form
                :store="Person"
                :ignore-fields="ignoreFields"
                @saved="onSaved"
            />

            <ActionForm
                :store="Person"
                :buttons="['cancel', 'reset', 'edit', 'save']"
            />

        </q-card-section>

      </q-card>

    </q-dialog>

  </div>

</template>

<script setup>

import { ref } from 'vue'

import Form from '../../components/engine/FormComponent.vue'
import ActionForm from '../../components/auto/ActionForm.vue'

import { usePersonStore } from '../../stores/PersonStore'

import PersonCard from './PersonCard.vue'

// ==========================================
// EMITS
// ==========================================

const emit = defineEmits([
  'selected',
])

// ==========================================
// STORE
// ==========================================

const Person = usePersonStore()

// ==========================================
// STATE
// ==========================================


const showCreateDialog = ref(false)

// ==========================================
// IGNORE
// ==========================================

const ignoreFields = [
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at',
  'entity',
  'branch',
  'user'
]

// ==========================================
// SEARCH
// ==========================================

async function doSearch() {

  if (!Person.search) {

    Person.rows = []

    return
  }

    await Person.loadData()

}

// ==========================================
// SELECT
// ==========================================

function selectPerson(person) {
  Person.form = person
   Person.form = {
    ...Person.form,
    name: Person.search
  }
  emit('selected', person)
}

// ==========================================
// CREATE
// ==========================================

function createNew() {

  Person.resetForm?.()

  Person.form = {
    ...Person.form,
    name: Person.search
  }

  showCreateDialog.value = true

}

// ==========================================
// SAVED
// ==========================================

function onSaved(res) {

    const person = res?.data || res
    Person.row = person 
    Person.form = person 

    showCreateDialog.value = false
    emit('selected', person)
}

</script>