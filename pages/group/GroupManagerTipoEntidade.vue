<template>
  <s-card class="column full-height">

    <!-- HEADER -->
    <q-bar class="bg-primary text-white">
      <div class="text-subtitle1 text-weight-bold">
        Gestão de Grupos
      </div>
      <q-space />

      <q-badge
        color="white"
        text-color="primary"
        v-if="TipoEntidade.selectedGroups.length"
      >
        {{ TipoEntidade.selectedGroups.length }} ativos
      </q-badge>
    </q-bar>

    <q-separator />

    <!-- ADD GROUP -->
    <q-card-section class="row items-center q-gutter-sm">

      <q-input
        v-model="newGroup"
        dense
        outlined
        clearable
        class="col"
        label="Criar novo grupo"
        @keyup.enter="addGroup"
      >
        <template #append>
          <q-icon name="group_add" />
        </template>
      </q-input>

      <q-btn
        icon="add"
        color="primary"
        round
        @click="addGroup"
        :disable="!newGroup"
      />

    </q-card-section>

    <q-separator />

    <!-- LIST -->
    <q-card-section class="col scroll q-pa-none">

      <q-list separator bordered>

        <q-item
          v-for="group in TipoEntidade.groups"
          :key="group.id"
          clickable
          v-ripple
          :class="{
            'bg-grey-2': TipoEntidade.hasGroup(group.id)
          }"
          @click="TipoEntidade.toggleGroup(group)"
        >

          <!-- CHECK -->
          <q-item-section avatar>
            <q-checkbox
              :model-value="TipoEntidade.hasGroup(group.id)"
              @click.stop
              @update:model-value="() => TipoEntidade.toggleGroup(group)"
              color="primary"
            />
          </q-item-section>

          <!-- NAME -->
          <q-item-section>
            <q-item-label class="text-weight-medium">
              {{ group.name }}
            </q-item-label>
          </q-item-section>

          <!-- STATUS -->
          <q-item-section side>

            <q-chip
              size="sm"
              :color="TipoEntidade.hasGroup(group.id) ? 'primary' : 'grey-5'"
              text-color="white"
              dense
            >
              {{ TipoEntidade.hasGroup(group.id) ? 'Ativo' : 'Inativo' }}
            </q-chip>

          </q-item-section>

        </q-item>

      </q-list>

      <!-- EMPTY -->
      <div
        v-if="!TipoEntidade.groups.length"
        class="text-center text-grey q-pa-md"
      >
        Nenhum grupo encontrado
      </div>

    </q-card-section>

  </s-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'

const props = defineProps({
  tipoEntidadeId: [String, Number]
})

const TipoEntidade = useTipoEntidadeStore()
const newGroup = ref('')

// INIT
onMounted(() => {
  TipoEntidade.loadGroups(props.tipoEntidadeId)
})

// ADD GROUP
function addGroup() {
  if (!newGroup.value) return

  TipoEntidade.createGroup(newGroup.value.trim())
  newGroup.value = ''
}
</script>