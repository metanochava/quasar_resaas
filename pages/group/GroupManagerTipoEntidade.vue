<template>
  <s-card class="column full-height">

    <q-bar class="bg-primary text-white">
      <div class="text-h6">Grupos</div>
      <q-space />
    </q-bar>

    <q-separator />

    <!-- ADD -->
    <q-card-section class="row q-gutter-sm">
      <q-input v-model="newGroup" dense outlined label="Novo Grupo" @keyup.enter="addGroup" />
      <q-btn icon="add" color="primary" @click="addGroup" />
    </q-card-section>

    <q-separator />

    <!-- LIST -->
    <q-card-section class="col scroll">

      <q-list separator>

        <q-item
          v-for="group in TipoEntidade.groups"
          :key="group.id"
          clickable
          @click="TipoEntidade.toggleGroup(group)"
        >
          <q-item-section avatar>
            <q-checkbox
              :model-value="TipoEntidade.hasGroup(group.id)"
              @click.stop
              @update:model-value="() => TipoEntidade.toggleGroup(group)"
            />
          </q-item-section>

          <q-item-section>
            {{ group.name }}
          </q-item-section>

          <q-item-section side>
            <q-badge :color="TipoEntidade.hasGroup(group.id) ? 'primary' : 'grey'">
              {{ TipoEntidade.hasGroup(group.id) ? 'Ativo' : 'Inativo' }}
            </q-badge>
          </q-item-section>

        </q-item>

      </q-list>

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

onMounted(() => {
  TipoEntidade.loadGroups(props.tipoEntidadeId)
})

function addGroup() {
  if (!newGroup.value) return
  TipoEntidade.createGroup(newGroup.value)
  newGroup.value = ''
}
</script>