<script setup>
import { computed } from 'vue'
import { useTipoEntidadeStore } from '../../stores/TipoEntidadeStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'

const TipoEntidade = useTipoEntidadeStore()
const selected = computed(() => TipoEntidade.row?.name?.toLowerCase() || null)
</script>

<template>
  <DashboardRenderer v-if="selected" :name="selected" />
  <DashboardComponent v-else />
</template>