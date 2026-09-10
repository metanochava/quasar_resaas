<script setup>
import { computed } from 'vue'

import { useUserStore } from '../../stores/UserStore'
import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'

// User.Entity já fica populado logo a seguir ao login
// (UserStore.selectContext()/EntityStore.select_()) - Entity.entity_type
// vem serializado como {id,value,label} (RepresentationMixin trata
// toda FK assim), 'label' é o nome real do EntityType
// (EntityType.RESAAS.label_field = "name").
//
// EntityTypeStore.row é o registo actualmente aberto num ecrã de CRUD
// genérico (createBaseStore) - só fica preenchido quando um admin
// está a editar um EntityType, nunca automaticamente após o login;
// por isso a home ficava sem nenhum dashboard logo a seguir a entrar
// (row ainda vazio nesse momento). Mantido como segunda fonte
// (fallback), não removido - LoginPage.vue já o popula noutro
// contexto (marca da página de login antes de autenticar).
const User = useUserStore()
const TipoEntidade = useEntityTypeStore()

const selected = computed(() => {
  const fromEntity = User.Entity?.entity_type?.label || User.Entity?.entity_type?.name
  const fromCrudRow = TipoEntidade.row?.name

  return (fromEntity || fromCrudRow || '').toLowerCase() || null
})
</script>

<template>
  <DashboardRenderer v-if="selected" :name="selected" />
  <DashboardComponent v-else />
</template>