<template>

  <div>

    <!-- SEARCH -->
    <q-input
      v-model="search"
      outlined
      dense
      clearable
      label="Pesquisar pessoa"
      debounce="500"
      @update:model-value="doSearch"
    >

      <template #prepend>
        <q-icon name="search" />
      </template>

    </q-input>

    <!-- RESULTS -->
    <q-list
      bordered
      separator
      class="q-mt-sm rounded-borders"
      v-if="Person.personsFound.length"
    >

      <q-item
        v-for="person in Person.personsFound"
        :key="person.id"
        clickable
        @click="selectPerson(person)"
      >

        <q-item-section avatar>

          <q-avatar color="primary" text-color="white">

            {{ initials(person.full_name) }}

          </q-avatar>

        </q-item-section>

        <q-item-section>

          <q-item-label>
            {{ person.full_name }}
          </q-item-label>

          <q-item-label caption>

            {{ person.phone }}

          </q-item-label>

        </q-item-section>

      </q-item>

    </q-list>

    <!-- EMPTY -->
    <div
      v-if="search && !Person.personsFound.length"
      class="q-mt-md"
    >

      <q-banner rounded class="bg-grey-2">

        Pessoa não encontrada

        <template #action>

          <q-btn
            flat
            color="primary"
            label="Criar Pessoa"
            @click="createNew"
          />

        </template>

      </q-banner>

    </div>

    <!-- PERSON FORM -->
    <q-dialog v-model="showCreate">

      <q-card style="min-width:700px">

        <q-card-section class="text-h6">

          Nova Pessoa

        </q-card-section>

        <q-card-section>

          <FormTwo
            :store="Person"
            @saved="onCreated"
          />

        </q-card-section>

      </q-card>

    </q-dialog>

  </div>

</template>

<script setup>

import { ref } from 'vue'

import  FormTwo  from './../../components/auto/FormTwo.vue'
import { usePersonStore }  from '../../stores/PersonStore'

const emit = defineEmits([
  'selected',
  'created'
])

const Person = usePersonStore()

const search = ref('')

const showCreate = ref(false)

// ======================================
// SEARCH
// ======================================

async function doSearch() {

  if (!search.value) {
    Person.personsFound = []
    return
  }

  await Person.searchPersons(search.value)
}

// ======================================
// SELECT
// ======================================

function selectPerson(person) {

  Person.selectPerson(person)

  emit('selected', person)
}

// ======================================
// CREATE
// ======================================

function createNew() {

  Person.resetForm()

  Person.form = {
    full_name: search.value
  }

  showCreate.value = true
}

// ======================================
// CREATED
// ======================================

function onCreated(person) {

  showCreate.value = false

  emit('created', person)
}

// ======================================
// INITIALS
// ======================================

function initials(name = '') {

  return name
    .split(' ')
    .map(i => i[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

</script>