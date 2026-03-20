<script setup>
import { ref, computed, watch } from 'vue'
import { componentMap } from '../../boot/component_map'


// ---------------- PROPS ----------------
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schema: { type: Array, default: () => [] }
})

// ---------------- EMITS ----------------
const emit = defineEmits(['update:modelValue','apply'])

// ---------------- FIX V-MODEL ----------------
const localModel = ref(props.modelValue)

watch(() => props.modelValue, v => {
  localModel.value = v
})

watch(localModel, v => {
  emit('update:modelValue', v)
})

// ---------------- STATE ----------------
const tab = ref('basic')
const filters = ref({})
const activeCount = computed(() =>
  Object.values(filters.value).filter(v => v !== null && v !== '').length
)

// ---------------- COMPUTED ----------------
// const basicFields = computed(() =>
//   props.schema.filter(f => {
//     if (f.ui?.isFile || f.ui?.isImage) return false
//     if (f.ui?.isRelation) return true
//     if (f.ui?.isChar || f.ui?.isNumeric) return true
//     return false
//   }).slice(0, 10)
// )

// const advancedFields = computed(() =>
//   props.schema.filter(f => !(f.ui?.isFile || f.ui?.isImage))
// )

const basicFields = computed(() =>
  props.schema
    .filter(f => {
      if (f.ui?.isFile || f.ui?.isImage) return false
      if (f.ui?.isRelation) return true
      if (f.ui?.isChar || f.ui?.isNumeric) return true
      return false
    })
    .slice(0, 10)
)

const advancedFields = computed(() =>
  props.schema.filter(f =>
    !(f.ui?.isFile || f.ui?.isImage) &&
    !basicFields.value.find(b => b.name === f.name)
  )
)

// ---------------- ACTIONS ----------------
function close() {
  localModel.value = false
}

function clear() {
  filters.value = {}
}

function apply() {
  const payload = Object.fromEntries(
    Object.entries(filters.value).filter(([_, v]) =>
      v !== null && v !== undefined && v !== ''
    )
  )

  emit('apply', {
    ...payload,
    __resetPage: true
  })
  localModel.value = false


}
</script>

<template>
  <q-dialog v-model="localModel" persistent>
    <s-card style="min-width: 720px; max-width: 92vw;">
      <s-btn :label="'Aplicar ' + ( activeCount )" />
      <!-- HEADER -->
      <q-bar class="row items-center justify-between" :class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'">
        <div class="text-h6">Filtros</div>
        <s-btn dense flat icon="close" @click="close" >
          <q-tooltip>{{('Fechar')}}</q-tooltip>
        </s-btn>
      </q-bar>

      <q-separator />

      <!-- BODY -->
      <q-card-section v-if="!schema.length">
        <q-spinner />
      </q-card-section>

      <q-card-section v-else>
          <!-- form normal -->

        <q-tabs v-model="tab" dense>
          <q-tab name="basic" label="Básico" />
          <q-tab name="advanced" label="Avançado" />
        </q-tabs>

        <q-separator class="q-my-sm" />

        <q-tab-panels v-model="tab">

          <!-- BASIC -->
          <q-tab-panel name="basic" class="row q-col-gutter-sm">
            <div v-for="f in basicFields" :key="f.name" class="col-4">
              <component
                :is="componentMap[f.component] || f.component"
                v-model="filters[f.name]"
                v-bind="f.props"
                :label="f.label"
                dense
                outline
              />
            </div>
          </q-tab-panel>

          <!-- ADVANCED -->
          <q-tab-panel name="advanced" class="row q-col-gutter-sm" >
            <div v-for="f in advancedFields" :key="f.name" class="col-4">
              <component
               :is="componentMap[f.component] || f.component"
                v-model="filters[f.name]"
                v-bind="f.props"
                :label="f.label"
                dense
                outlined
              />
            </div>
          </q-tab-panel>

        </q-tab-panels>

      </q-card-section>

      <q-separator />

      <!-- ACTIONS -->
      <q-card-actions align="right">
        <s-btn flat label="Limpar" @click="clear" />
        <s-btn flat label="Cancelar" @click="close" />
        <s-btn color="primary" label="Aplicar" @click="apply" />
      </q-card-actions>

    </s-card>
  </q-dialog>
</template>