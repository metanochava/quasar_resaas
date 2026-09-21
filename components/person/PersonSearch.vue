<template>
  <!-- BUTTON TO OPEN THE MODAL -->
  <div class="q-pa-sm col-12">
    <s-btn
      color="primary"
      icon="person_search"
      label="Search Person"
      no-caps
      class="full-width"
      @click="openSearchDialog"
    />
  </div>

  <!-- SEARCH MODAL -->
  <q-dialog
    v-model="showSearchDialog"
    persistent
  >
    <s-modal-card :title="tdc('Search Person')" icon="person_search" width="900px" @close="closeSearchDialog">
      <q-input
        v-model="Person.search"
        outlined
        dense
        clearable
        debounce="500"
        label="Search person"
        @update:model-value="doSearch"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- LOADING -->
      <div
        v-if="Person.loading"
        class="flex flex-center q-pa-lg"
      >
        <q-spinner :color="$q.dark.isActive ? 'white' : 'primary'" size="48px" />
      </div>

      <!-- RESULTS -->
      <div
        v-else-if="Person.search"
        class="q-mt-md"
      >
        <PersonCard
          v-for="person in Person.rows"
          :key="person.id"
          :person="person"
          class="q-mb-sm"
          @select="selectPerson"
        />

        <div
          v-if="Person.rows.length === 0"
          class="text-grey text-caption text-center q-pa-md"
        >
          No person found
        </div>
      </div>

      <template #footer>
        <s-btn
          flat
          color="grey"
          label="Cancel"
          no-caps
          @click="closeSearchDialog"
        />
        <q-space />
        <s-btn
          color="primary"
          icon="person_add"
          label="Create Person"
          no-caps
          @click="openCreateDialog"
        />
      </template>
    </s-modal-card>
  </q-dialog>

  <!-- MODAL TO CREATE PERSON -->
  <q-dialog
    v-model="showCreateDialog"
    persistent
  >
    <s-modal-card :title="tdc('Create Person')" icon="person_add" width="900px" footer-raw @close="closeCreateDialog">
      <Form
        :store="Person"
        :ignore-fields="ignoreFields"
        @saved="onSaved"
      />

      <template #footer>
        <ActionForm
          :store="Person"
          :buttons="['cancel', 'reset', 'edit', 'save']"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'

import Form from '../../components/engine/FormComponent.vue'
import ActionForm from '../../components/auto/ActionForm.vue'


import { usePersonStore } from '../../stores/PersonStore'

import PersonCard from './PersonCard.vue'
import { tdc } from '../../services/translation'


const Person = usePersonStore()

const showSearchDialog = ref(false)
const showCreateDialog = ref(false)

const ignoreFields = [
  'id',
  'user',
  'entity',
  'branch',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'deleted_at'
]

function openSearchDialog() {
  Person.search = ''
  Person.rows = []
  showSearchDialog.value = true
}

function closeSearchDialog() {
  showSearchDialog.value = false
  Person.search = ''
  Person.rows = []
}

async function doSearch(value) {
  const search = value?.trim()

  if (!search) {
    Person.rows = []
    return
  }

  // Adapt to the name of the existing action in your PersonStore
  await Person.loadData({
    search
  })
}



function selectPerson(person) {
  Person.row = person
  Person.form = person
  closeSearchDialog()
}

function openCreateDialog() {
  showSearchDialog.value = false
  showCreateDialog.value = true

  Person.resetForm?.()
}

function closeCreateDialog() {
  showCreateDialog.value = false
}

function onSaved(person) {
  Person.row = person

  showCreateDialog.value = false
  showSearchDialog.value = false
}
</script>