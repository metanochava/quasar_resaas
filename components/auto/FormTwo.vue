<script setup>
import { ref, computed, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../boot/base'
import Form from '../engine/FormComponent.vue'
import { useUserStore } from '../../stores/UserStore'

const slots = useSlots()

const User = useUserStore()
const router = useRouter()
const emit = defineEmits(['saved'])
const props = defineProps({
  store: { type: Object, default: null },
  ignoreFields: { type: Array, default: () => [] },

  // 🔥 layout configurável
  leftCol: { type: String, default: 'col-3' },
  centerCol: { type: String, default: 'col' },
  rightCol: { type: String, default: 'col-4' }


})

const formRef = ref(null)

const isEdit = computed(() => !!props.store.form?.id)

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

async function save() {
  if (props.externalSave) {
    emit('save')
  } else {
    const  data = await formRef.value?.save() // modo standalone
    const  data1 = formRef.value?.row 
    console.log(data1)
    let dd = {id: 898, 'nome': data1}
    emit('saved', dd  )
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <s-card class="dialog-card column no-wrap" flat >

    <!-- ================= HEADER FIXO ================= -->
    <div v-if="hasHeader" class="col-12">
      <slot name="header" />
    </div>
    <q-card-actions v-if="!hasHeader"  align="right" class="q-pa-md">

      <div class="text-h5 text-weight-bold ">
        {{ isEdit
          ? tdc('Editar') + ' ' + tdc(store.model)
          : tdc('Novo') + ' ' + tdc(store.model )
        }}
      </div>

      <q-space />

      <s-btn
        flat
        color="grey-7"
        :label="tdc('Cancelar')"
        @click="goBack"
      />

      <s-btn v-if="User.can('change_' + (store.model || '').toLowerCase())" v-show="isEdit"
        color="secondary"
        unelevated
        icon="edit"
        :loading="store.saving"
        :label="tdc('Edit')"
        @click="save"
      />
      <s-btn v-if="User.can('add_' + (store.model || '').toLowerCase()) " v-show="!isEdit"
        color="primary"
        unelevated
        icon="save"
        :loading="store.saving"
        :label="tdc('Save')"
        @click="save"
      />

    </q-card-actions>
    <q-separator v-if="!hasHeader" />



    <!-- ================= BODY (SCROLL AQUI) ================= -->
    <q-card-section class="col scroll">

      <div class="row q-col-gutter-xs">

        <!-- HEADER SLOT (fica fixo dentro do scroll topo) -->

        <!-- LEFT -->
        <div v-if="hasLeft" :class="[leftClass]">
          <slot name="left" />
        </div>

        <!-- CENTER -->
        <div :class="[centerClass]">

          <div v-if="hasCenter">
            <slot name="center" />
          </div>

          <Form
            v-else
            ref="formRef"
            :store="store"
            :ignore-fields="ignoreFields"
            @saved="save"
          />

        </div>

        <!-- RIGHT -->
        <div v-if="hasRight" :class="[rightClass]">
          <slot name="right" />
        </div>

        <!-- FOOTER SLOT (fica no fim do scroll) -->
        

      </div>

    </q-card-section>


    <!-- ================= FOOTER FIXO ================= -->
    <q-separator v-if="!hasFooter" />
    
    <q-card-actions v-if="!hasFooter" align="right" class="q-pa-md">
      
      <s-btn
        flat
        color="grey-7"
        :label="tdc('Cancelar')"
        @click="goBack"
      />

      <s-btn v-if="User.can('change_' + (store.model || '').toLowerCase())" v-show="isEdit"
        color="secondary"
        unelevated
        icon="edit"
        :loading="store.saving"
        :label="tdc('Edit')"
        @click="save"
      />
      <s-btn v-if="User.can('add_' + (store.model || '').toLowerCase()) " v-show="!isEdit"
        color="primary"
        unelevated
        icon="save"
        :loading="store.saving"
        :label="tdc('Save')"
        @click="save"
      />

    </q-card-actions>
    <div v-if="hasFooter" class="col-12">
      <slot name="footer" />
    </div>

  </s-card>
</template>


<style scoped>
.dialog-card {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

/* 🔥 SCROLL CONTROLADO */
.scroll {
  overflow-y: auto;
}
</style>