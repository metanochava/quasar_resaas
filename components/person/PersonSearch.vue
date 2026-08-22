<template>
  <!-- BOTÃO PARA ABRIR A MODAL -->
  <div class="q-pa-sm col-12">
    <s-btn
      color="primary"
      icon="person_search"
      label="Pesquisar Pessoa"
      no-caps
      class="full-width"
      @click="openSearchDialog"
    />
  </div>

  <!-- MODAL DE PESQUISA -->
  <q-dialog
    v-model="showSearchDialog"
    persistent
  >
    <q-card
      style="width: 900px; max-width: 95vw"
      class="rounded-borders"
    >
      <q-bar :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
        <div class="text-h6">
        {{ tdc('Pesquisar Pessoa') }}
        </div>

        <q-space />

        <s-btn
          flat
          round
          dense
          icon="close"
          @click="closeSearchDialog"
        />
      </q-bar>

      <q-card-section>
        <q-input
          v-model="Person.search"
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

        <!-- LOADING -->
        <div
          v-if="Person.loading"
          class="flex flex-center q-pa-lg"
        >
          <q-spinner
            color="primary"
            size="35px"
          />
        </div>

        <!-- RESULTADOS -->
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
            Nenhuma pessoa encontrada
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="between" class="q-pa-md">
        <s-btn
          flat
          color="grey"
          label="Cancelar"
          no-caps
          @click="closeSearchDialog"
        />

        <s-btn
          color="primary"
          icon="person_add"
          label="Criar Pessoa"
          no-caps
          @click="openCreateDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- MODAL PARA CRIAR PESSOA -->
  <q-dialog
    v-model="showCreateDialog"
    persistent
  >
    <q-card
      style="width: 900px; max-width: 95vw"
      class="rounded-borders"
    >
      <q-bar class="row items-center " :class="$q.dark.isActive ? 'bg-dark text-white' : ' bg-primary text-white'">
        <div class="text-h6">
          Criar Pessoa
        </div>

        <q-space />

        <s-btn
          flat
          round
          dense
          icon="close"
          @click="closeCreateDialog"
        />
      </q-bar>

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

  // Adapte ao nome da action existente no seu PersonStore
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