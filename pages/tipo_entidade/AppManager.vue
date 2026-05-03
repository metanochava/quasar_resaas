<template>
  <s-card class="column full-height">

    <q-bar class="bg-primary text-white">
      <div class="text-h6">Gestão de Módulos</div>
      <q-space />
    </q-bar>

    <q-separator />

    <q-card-section class="col scroll">

      <q-list separator>

        <q-item
          v-for="mod in TipoEntidade.modulos"
          :key="mod.id"
          clickable
          @click="TipoEntidade.toggleModulo(mod)"
        >

          <q-item-section avatar>
            <q-checkbox
              :model-value="TipoEntidade.hasModulo(mod.id)"
              @click.stop
              @update:model-value="() => TipoEntidade.toggleModulo(mod)"
            />
          </q-item-section>

          <q-item-section>
            {{ mod.nome }}
          </q-item-section>

          <q-item-section side>
            <q-chip
              :color="TipoEntidade.hasModulo(mod.id) ? 'primary' : 'grey'"
              text-color="white"
            >
              {{ TipoEntidade.hasModulo(mod.id) ? 'Ativo' : 'Inativo' }}
            </q-chip>
          </q-item-section>

        </q-item>

      </q-list>

    </q-card-section>

  </s-card>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'

const props = defineProps({
  tipoEntidadeId: [String, Number]
})

const TipoEntidade = useTipoEntidadeStore()

onMounted(() => {
  TipoEntidade.loadModulos(props.tipoEntidadeId)
})
</script>