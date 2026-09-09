<script setup>
import { computed } from 'vue'

import { useEntityTypeStore } from '../../stores/EntityTypeStore'
import DashboardRenderer from './DashboardRenderer.vue'
import DashboardComponent from '../DashboardComponent.vue'

const TipoEntidade = useEntityTypeStore()
const selected = computed(() => TipoEntidade.row?.name?.toLowerCase() || null)
</script>

<template>
  <DashboardRenderer v-if="selected" :name="selected" />
  <DashboardComponent v-else />
</template>