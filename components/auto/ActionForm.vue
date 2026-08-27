<template>

  <s-card
    flat
    class="q-pa-sm"
  >

    <div class="row col-12 items-center">

      <!-- =====================================
          LEFT
      ====================================== -->

      <div class="col-2 row justify-start q-gutter-sm">

        <s-btn
          v-if="
            has('delete') &&
            User.can(
              store.permissions?.delete ||
              'delete_' + (store.model || '').toLowerCase()
            )
          "
          v-show="isEdit"
          type="button"
          color="negative"
          unelevated
          icon="delete"
          :loading="store.saving"
          :label="tdc('Delete')"
          @click="deleteRecord"
        />

      </div>


      <!-- =====================================
          RIGHT
      ====================================== -->

      <div class="col-10 row justify-end q-gutter-sm " style="margin-right:-25px;">

        <!-- CANCEL -->
        <s-btn
          v-if="has('cancel')"
          flat
          color="grey"
          :label="tdc('Cancel')"
          @click="emit('cancel')"
        />

        <!-- RESET -->
        <s-btn
          v-if="has('reset')"
          flat
          type="reset"
          color="grey"
          :label="tdc('Reset')"
          @click="reset"
        />

        <!-- EDIT -->
        <s-btn
          v-if="
            has('edit') &&
            User.can(
              store.permissions?.change ||
              'change_' + (store.model || '').toLowerCase()
            )
          "
          v-show="isEdit"
          type="submit"
          color="secondary"
          unelevated
          icon="edit"
          :loading="store.saving"
          :label="tdc('Edit')"
          @click="emit('save')"
        />

        <!-- SAVE -->
        <s-btn
          v-if="
            has('save') &&
            User.can(
              store.permissions?.add ||
              'add_' + (store.model || '').toLowerCase()
            )
          "
          v-show="!isEdit"
          type="submit"
          color="primary"
          unelevated
          icon="save"
          :loading="store.saving"
          :label="tdc('Save')"
          @click="emit('save')"
        />

      </div>

    </div>

  </s-card>

</template>


<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useUserStore } from '../../stores/UserStore'
import { tdc } from '../../services/translation'

// =============================================
// PROPS
// =============================================

const props = defineProps({

  store: {
    type: Object,
    required: true
  },

  reform: {
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


// =============================================
// EMITS
// =============================================

const emit = defineEmits([
  'save',
  'cancel',
  'reset',
  'delete'
])


// =============================================
// STORE
// =============================================

const User = useUserStore()


// =============================================
// HELPERS
// =============================================

const has = (button) => {
  return props.buttons.includes(button)
}


// =============================================
// EDIT MODE
// =============================================

const isEdit = computed(() => {

  return !!(
    props.store?.row?.id ||
    props.store?.form?.id
  )

})


// =============================================
// RESET
// =============================================

const reset = () => {

  props.reform?.resetForm?.()

  emit('reset')

}


// =============================================
// DELETE
// =============================================

const deleteRecord = async () => {
  const obj = props.store?.form
  if (props.reform?.delete) {

    await props.reform.delete()

  }
  else if (props.store?.delete) {

    await props.store.delete()

  }

  emit('delete', obj)

}

</script>