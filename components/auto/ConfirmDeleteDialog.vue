<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <s-modal-card
      :title="isHardDelete ? tdc('Delete permanently?') : tdc('Confirm?')"
      :icon="isHardDelete ? 'warning' : 'help'"
      width="420px"
      @close="close"
    >
      <div>
        {{ tdc('Are you sure you want to delete:') }}
      </div>

      <b v-if="row">
        {{ row[props.id] || row?.value || row?.id }}

        <br />

        {{ row[props.label]?.label || row?.name || row?.label || '' }}
      </b>

      <div
        v-if="isHardDelete"
        class="text-red q-mt-sm"
      >
        ⚠️ {{ tdc('This action cannot be undone') }}
      </div>

      <template #footer>
        <s-btn
          flat
          dense
          :label="tdc('Cancel')"
          @click="close"
        />

        <s-btn
          dense
          :color="isHardDelete ? 'red' : 'orange'"
          :label="
            isHardDelete
              ? tdc('Delete permanently')
              : tdc('Delete')
          "
          @click="confirm"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>


<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'


const props = defineProps({

  modelValue: {
    type: Boolean,
    default: false,
    required: true
  },

  type: {
    type: String,
    default: 'delete',
    required: true
  },

  row: {
    type: Object,
    default: null
  },

  label: {
    type: String,
    default: null
  },

  id: {
    type: String,
    default: null
  }

})


const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel'
])


const isHardDelete = computed(() =>
  props.type === 'hard_delete'
)


function close() {

  emit('update:modelValue', false)

  emit('cancel')

}


function confirm() {

  emit('confirm', {
    type: props.type,
    row: props.row
  })

}
</script>