<script setup>
import { ref, computed, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { tdc } from '../../services/translation'
import Form from '../engine/FormComponent.vue'
import { useUserStore } from '../../stores/UserStore'
import ActionForm from '../../components/auto/ActionForm.vue'

const slots = useSlots()

const User = useUserStore()
const router = useRouter()
const emit = defineEmits(['saved', 'save'])
const props = defineProps({
  store: { type: Object, default: null },
  ignoreFields: { type: Array, default: () => [] },

  // Optional short description under the title (e.g. "Manage the
  // organisation's information and settings.") - purely presentational,
  // opt-in, so every existing <FormTwo> without it renders exactly as
  // before.
  subtitle: { type: String, default: null },

  // 🔥 configurable layout
  leftCol: { type: String, default: 'col-3' },
  centerCol: { type: String, default: 'col' },
  rightCol: { type: String, default: 'col-4' },

  // quando true, save() só emite 'save' (o pai trata da persistência
  // real) em vez de gravar via formRef internamente
  externalSave: { type: Boolean, default: false }
})

const layout = computed(() => User.ps?.layout || {})

// content_width/content_max_width (django_resaas.saas.models.
// layout_setting.LayoutSetting, já resolvido em User.ps.layout.content)
// só restringe a largura quando o próprio LayoutSetting está
// configurado como 'boxed' - no 'fluid' (default do modelo) o
// comportamento fica exactamente como antes, sem qualquer max-width.
const boxedStyle = computed(() => {
  const content = layout.value.content || {}
  if (content.width !== 'boxed' || !content.max_width) return {}
  return { maxWidth: `${content.max_width}px`, marginInline: 'auto' }
})

const formRef = ref(null)

const isEdit = computed(() => !!props.store.form?.id)

// 🔥 DETECTAR SLOTS
const hasHeader = computed(() => !!slots.header)
const hasCenter = computed(() => !!slots.center)
const hasFooter = computed(() => !!slots.footer)

const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)

// 🔥 DYNAMIC CLASSES (GUARDED)
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
    return
  }

  const data = await formRef.value?.save()

  emit('saved', {
    data,
    row: props.store.row,
    form: props.store.form,
    rowr: formRef.value.row,
    formf: formRef.value.form
  })
}

function goBack() {
  router.back()
}

// ActionForm's own Reset handler calls `props.reform?.resetForm?.()`
// before emitting 'reset' - `reform` was never passed here, so Reset
// silently did nothing to the form fields, and 'reset'/'delete' had no
// listener at all (Vue warns "onReset/onDelete is not a function" the
// moment either button is clicked). Fixed by passing the actual Form
// ref (now exposing resetForm(), see FormComponent.vue) and defining
// both handlers - delete already happens inside ActionForm itself
// (store.remove()); going back afterwards matches Cancel's behaviour.
function onReset() {}

function onDelete() {
  goBack()
}
</script>

<template>
  <s-card class="dialog-card column no-wrap" flat :style="boxedStyle">

    <!-- ================= HEADER FIXO ================= -->
    <div v-if="hasHeader" class="col-12">
      <slot name="header" />
    </div>
    <q-card-section v-if="!hasHeader" class="row items-center justify-between q-py-md q-px-md form-two-header">

      <div>
        <div class="text-h6 text-weight-bold">
          {{ isEdit
            ? tdc('Edit') + ' ' + tdc(store.model)
            : tdc('New') + ' ' + tdc(store.model )
          }}
        </div>
        <div v-if="subtitle" class="text-caption form-two-subtitle">
          {{ tdc(subtitle) }}
        </div>
      </div>

      <div class="row q-gutter-sm">
        <s-btn
          flat
          color="grey-7"
          :label="tdc('Cancel')"
          @click="goBack"
        />

        <s-btn v-if="User.can(store.permissions?.change || 'change_' + (store.model || '').toLowerCase())" v-show="isEdit"
          color="secondary"
          unelevated
          icon="edit"
          :loading="store.saving"
          :label="tdc('Edit')"
          @click="save"
        />
        <s-btn v-if="User.can(store.permissions?.add || 'add_' + (store.model || '').toLowerCase()) " v-show="!isEdit"
          color="primary"
          unelevated
          icon="save"
          :loading="store.saving"
          :label="tdc('Save')"
          @click="save"
        />
      </div>

    </q-card-section>
    <q-separator v-if="!hasHeader" />



    <!-- ================= BODY (SCROLL AQUI) ================= -->
    <q-card-section class="col scroll q-pa-md">

      <div class="row q-col-gutter-md form-two-grid">

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
          />

        </div>

        <!-- RIGHT -->
        <div v-if="hasRight" :class="[rightClass]">
          <slot name="right" />
        </div>

      </div>

    </q-card-section>


    <!-- ================= FOOTER FIXO ================= -->
    <q-separator v-if="!hasFooter" />

    <ActionForm v-if="!hasFooter"
      :store="store"
      :reform="formRef"
      :buttons="['cancel', 'reset', 'edit', 'delete', 'save']"

      @cancel="goBack"
      @reset="onReset"
      @edit="save"
      @delete="onDelete"
      @save="save"
    />
    <div v-if="hasFooter" class="col-12">
      <slot name="footer" />
    </div>

  </s-card>
</template>


<style scoped>
/* Mobile: always stack left/center/right regardless of the leftCol/
   centerCol/rightCol props' content - fixes forced desktop splits
   (e.g. centerCol="col-8" rightCol="col-4") that used to squeeze into
   unreadable slivers on small screens. Tablet/desktop keep whatever
   the props (or their defaults) already specify - untouched. */
@media (max-width: 599.98px) {
  .form-two-grid > div {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}

.form-two-subtitle {
  opacity: 0.65;
  margin-top: 2px;
}

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