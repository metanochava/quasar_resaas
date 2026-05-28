<template>

  <s-card
    flat
    class="q-pa-sm"
  >

    <div class="row items-center justify-between">
      {{ props.ref }}
      <!-- =====================================
          LEFT
      ====================================== -->

      <div class="row q-gutter-sm">

        <!-- RESET -->
        <s-btn
          v-if="has('reset')"
          flat
          color="grey-7"
          :label="tdc('Reset')"
          @click="props.ref?.resetForm?.()"
        />

      </div>

      <!-- =====================================
          RIGHT
      ====================================== -->

      <div class="row q-gutter-sm">

        <!-- EDIT -->
        <s-btn
          v-if="
            has('edit') &&
            User.can('change_' + (props.ref.model || '').toLowerCase())
          "
          v-show="isEdit"
          color="secondary"
          unelevated
          icon="edit"
          :loading="props.ref.saving"
          :label="tdc('Edit')"
          @click="props.ref?.save?.()"
        />

        <!-- DELETE -->
        <s-btn
          v-if="
            has('delete') &&
            User.can('delete_' + (props.ref.model || '').toLowerCase())
          "
          v-show="isEdit"
          color="negative"
          unelevated
          icon="delete"
          :loading="props.ref.saving"
          :label="tdc('Delete')"
          @click="props.ref?.delete?.()"
        />

        <!-- SAVE -->
        <s-btn
          v-if="
            has('save') &&
            User.can('add_' + (props.ref?.model || '').toLowerCase())
          "
          v-show="!isEdit"
          color="primary"
          unelevated
          icon="save"
          :loading="props.ref.saving"
          :label="tdc('Save')"
          @click="props.ref?.save?.()"
        />

      </div>

    </div>

  </s-card>

</template>

<script setup>

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { tdc } from '../../boot/base'
import { useUserStore } from '../../stores/UserStore'

// ==========================================
// ROUTER
// ==========================================

const router = useRouter()

// ==========================================
// STORE
// ==========================================

const User = useUserStore()

// ==========================================
// PROPS
// ==========================================

const props = defineProps({

  store: {
    type: Object,
    default: null
  },

  ref: {
    type: Object,
    default: null
  },
  buttons: {
    type: Array,
    default: () => [
      'cancel',
      'reset',
      'edit',
      'delete',
      'save'
    ]
  }

})

// ==========================================
// COMPUTED
// ==========================================

const isEdit = computed(() => {

  return !!props.store?.form?.id
})

// ==========================================
// METHODS
// ==========================================

function has(name) {

  return props.buttons.includes(name)
}

</script>

<style scoped>

</style>