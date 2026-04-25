<script setup>
import { ref, computed, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../boot/base'
import Form from '../engine/FormComponent.vue'

const router = useRouter()
const slots = useSlots()

const props = defineProps({
  schema: { type: Array, default: () => [] },
  module: { type: String, required: true },
  model: { type: String, required: true },
  data: { type: Object, default: null },

  canDo: { type: Function, default: null },
  ignoreFields: { type: Array, default: () => [] },

  // 🔥 layout configurável
  leftCol: { type: String, default: 'col-3' },
  centerCol: { type: String, default: 'col' },
  rightCol: { type: String, default: 'col-4' }
})

const formRef = ref(null)
const saving = ref(false)

const isEdit = computed(() => !!props.data?.id)

// 🔥 DETECTAR SLOTS
const hasHeader = computed(() => !!slots.header)
const hasCenter = computed(() => !!slots.center)
const hasFooter = computed(() => !!slots.footer)

const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)

// 🔥 CLASSES DINÂMICAS (BLINDADAS)
const leftClass = computed(() => props.leftCol || 'col-3')

const rightClass = computed(() => props.rightCol || 'col-4')

const centerClass = computed(() => {
  // sem side → ocupa tudo
  if (!hasLeft.value && !hasRight.value) return 'col-12'

  // com side → usa config ou fallback
  return props.centerCol || 'col'
})

function save() {
  formRef.value?.save()
}

function goBack() {
  router.back()
}
</script>

<template>
  <s-card class="dialog-card column no-wrap">

    <!-- 🔥 HEADER -->

    <!-- 🔥 HEADER PREMIUM -->
  
    <q-card-actions align="right" class="q-pa-md">
      <div class="text-h5 text-weight-bold">
        {{ isEdit
          ? tdc('Editar') + ' ' + tdc(model)
          : tdc('Novo') + ' ' + tdc(model)
        }}
      </div>

      <q-space />

      <s-btn
        flat
        color="grey-7"
        :label="tdc('Cancelar')"
        @click="goBack"
      />

      <s-btn
        color="primary"
        icon="save"
        :label="tdc('Salvar')"
        :loading="saving"
        unelevated
        @click="save"
      />

    </q-card-actions>

    <q-separator />

    <!-- 🔥 BODY -->
    <q-card-section class="col">

      <div class="row q-col-gutter-xs full-height">

        <!-- 🔥 HEADER -->
        <div
          v-if="hasHeader"
          :class="['col']"
        >
          <slot name="header" />
        </div>

        <!-- 🔥 LEFT -->
        <div
          v-if="hasLeft"
          :class="[leftClass, 'full-height']"
        >
          <slot name="left" />
        </div>

        <!-- 🔥 CENTER (FORM) -->
        <div
          :class="[centerClass, 'full-height']"
        >

          <div
            v-if="hasCenter"
          >
            <slot name="center" />
          </div>
          <Form
            v-else

            ref="formRef"
            :schema="schema"
            :module="module"
            :model="model"
            :data="data"
            :can-do="canDo"
            :ignore-fields="ignoreFields"
            @saved="goBack"
          />
        </div>

        <!-- 🔥 RIGHT -->
        <div
          v-if="hasRight"
          :class="[rightClass, 'full-height']"
        >
          <slot name="right" />
        </div>

        <!-- 🔥 FOOTER -->
        <div
          v-if="hasFooter"
          :class="['col']"
        >
          <slot name="footer" />
        </div>

      </div>

    </q-card-section>

    <q-separator />

    <!-- 🔥 FOOTER -->
    <q-card-actions align="right" class="q-pa-md">

      <s-btn
        flat
        color="grey-7"
        :label="tdc('Cancelar')"
        @click="goBack"
      />

      <s-btn
        color="primary"
        icon="save"
        :label="tdc('Salvar')"
        :loading="saving"
        unelevated
        @click="save"
      />

    </q-card-actions>

  </s-card>
</template>

<style scoped>
  .dialog-card {
    width: 100%;
    height: 98%;
    max-width: 100%;
    max-height: 98%;
  }
</style>