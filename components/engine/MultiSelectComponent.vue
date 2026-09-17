<script setup>
// Thin multi-value wrapper around s-select (SelectComponent.vue), which
// already fully supports `multiple` (a plain q-select prop it forwards
// via attrs) - a separate component only exists because the schema
// names it explicitly for ManyToManyField (see app_schema.py's
// _resolve_ui()) and Django Admin's own vocabulary distinguishes
// "select" from "multiselect". No select/relation/add-related logic is
// duplicated here; everything (including the "+" add-related button)
// is inherited as-is from SelectComponent.
import { useAttrs } from 'vue'
import SelectComponent from './SelectComponent.vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
</script>

<template>
  <SelectComponent v-bind="{ ...attrs, multiple: true, useChips: true }" />
</template>
