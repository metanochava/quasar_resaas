<template>

  <div>

    <!-- SEARCH -->
    <q-input
      v-model="search"
      outlined
      dense
      clearable
      debounce="500"
      label="Pesquisar pessoa"
      @update:model-value="doSearch"
    >

      <template #prepend>
        <q-icon name="search" />
      </template>

    </q-input>

    <!-- RESULTS -->
    <div class="q-mt-md">

      <PersonCard
        v-for="person in Person.personsFound"
        :key="person.id"
        :person="person"
        class="q-mb-sm"
        @select="selectPerson"
      />

    </div>

    <!-- EMPTY -->
    <q-banner
      v-if="search && !Person.personsFound.length"
      rounded
      class="bg-grey-2 q-mt-md"
    >

      Nenhuma pessoa encontrada

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

</template>

<script setup>

import { ref } from 'vue'
import { usePersonStore } from 'src/stores/PersonStore'

import PersonCard from './PersonCard.vue'

const emit = defineEmits([
  'selected',
  'create'
])

const Person = usePersonStore()

const search = ref('')

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

  emit('selected', person)
}

// ======================================
// CREATE
// ======================================

function createNew() {

  emit('create', search.value)
}

</script>