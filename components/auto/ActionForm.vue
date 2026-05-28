<template>

  <s-card
    flat
    class="q-pa-sm"
  >
  {{ store?.value.form }}

    <div class="row items-center justify-between">

      <!-- =====================================
          LEFT
      ====================================== -->

      <div class="row q-gutter-sm">

        <!-- CANCEL -->
        <s-btn
          v-if="has('back')"
          flat
          color="grey-7"
          icon="arrow_back"
          :label="tdc('Back')"
          @click="router.back()"
        />

        <!-- RESET -->
        <s-btn
          v-if="has('reset')"
          flat
          color="grey-7"
          icon="refresh"
          :label="tdc('Reset')"
          @click="store?.value.resetForm?.()"
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
            User.can('change_' + (store?.value.model || '').toLowerCase())
          "
          v-show="isEdit"
          color="secondary"
          unelevated
          icon="edit"
          :loading="store?.value.saving"
          :label="tdc('Edit')"
          @click="store?.value.save()"
        />

        <!-- DELETE -->
        <s-btn
          v-if="
            has('delete') &&
            User.can('delete_' + (store?.value.model || '').toLowerCase())
          "
          v-show="isEdit"
          color="negative"
          unelevated
          icon="delete"
          :loading="store?.value.saving"
          :label="tdc('Delete')"
          @click="store?.value.delete?.()"
        />

        <!-- SAVE -->
        <s-btn
          v-if="
            has('save') &&
            User.can('add_' + (store?.value.model || '').toLowerCase())
          "
          v-show="!isEdit"
          color="primary"
          unelevated
          icon="save"
          :loading="store?.value.saving"
          :label="tdc('Save')"
          @click="store?.value.save()"
        />

      </div>

    </div>

  </s-card>

</template>

<script setup>

import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { tdc } from '../../boot/base'
import { useUserStore } from '../../store?.values/UserStore'

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

  store?.value: {
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

  return !!props.store?.value?.form?.id
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