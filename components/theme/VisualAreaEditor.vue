<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { backgroundConfigToStyle } from '../../utils/visualArea'
import ColorField from './ColorField.vue'
import GradientBuilder from './GradientBuilder.vue'

// Editor genérico de uma área visual (header/footer/login) - fundo
// cor/gradiente/imagem/transparente + overlay + cor de texto. Usado
// pelo Theme Studio (DefinicoesLayout.vue) sobre os campos reais do
// modelo (Entity.header_*/footer_*/login_* -
// engine/models/mixins/visual_area.py), e reutilizável para qualquer
// outra área visual futura sem duplicar este formulário.

const props = defineProps({
  modelValue: { type: Object, required: true },
  label: { type: String, default: '' },
  showTextColor: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

function set(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const typeOptions = [
  { label: tdc('Color'), value: 'color' },
  { label: tdc('Gradient'), value: 'gradient' },
  { label: tdc('Image'), value: 'image' },
  { label: tdc('Transparent'), value: 'transparent' },
]

const previewImageUrl = computed(() => {
  const image = props.modelValue.background_image
  if (image instanceof File) return URL.createObjectURL(image)
  return image || null
})

const previewStyle = computed(() => {
  const type = props.modelValue.background_type

  if (type === 'color') {
    return backgroundConfigToStyle({ type: 'color', value: props.modelValue.background_color })
  }
  if (type === 'gradient') {
    return backgroundConfigToStyle({ type: 'gradient', value: props.modelValue.background_gradient })
  }
  if (type === 'image') {
    return backgroundConfigToStyle({ type: 'image', value: previewImageUrl.value })
  }
  if (type === 'transparent') {
    return { backgroundColor: 'transparent' }
  }
  return {}
})
</script>

<template>
  <s-card bordered class="q-pa-md q-mb-md visual-area-editor">
    <div class="text-subtitle1 q-mb-sm">{{ label }}</div>

    <s-select
      :model-value="modelValue.background_type"
      :options="typeOptions" emit-value map-options clearable
      :label="tdc('Background type')"
      :hint="tdc('Leave empty to inherit from a higher level')"
      class="q-mb-sm"
      @update:model-value="set('background_type', $event)"
    />

    <ColorField
      v-if="modelValue.background_type === 'color'"
      :model-value="modelValue.background_color" :label="tdc('Color')"
      class="q-mb-sm"
      @update:model-value="set('background_color', $event)"
    />

    <GradientBuilder
      v-if="modelValue.background_type === 'gradient'"
      :model-value="modelValue.background_gradient"
      class="q-mb-sm"
      @update:model-value="set('background_gradient', $event)"
    />

    <div v-if="modelValue.background_type === 'image'" class="q-mb-sm">
      <q-file
        :model-value="modelValue.background_image instanceof File ? modelValue.background_image : null"
        accept=".png,.jpg,.jpeg,.webp" dense outlined :label="tdc('Image')"
        @update:model-value="set('background_image', $event)"
      />
      <img v-if="previewImageUrl" :src="previewImageUrl" class="q-mt-sm image-preview" />
    </div>

    <div v-if="['gradient', 'image'].includes(modelValue.background_type)" class="q-mb-sm">
      <div class="text-caption text-grey-7">{{ tdc('Dark overlay') }}</div>
      <q-slider
        :model-value="modelValue.background_overlay || 0"
        :min="0" :max="1" :step="0.05" label color="primary"
        @update:model-value="set('background_overlay', $event)"
      />
    </div>

    <ColorField
      v-if="showTextColor"
      :model-value="modelValue.text_color" :label="tdc('Text color')"
      class="q-mb-sm"
      @update:model-value="set('text_color', $event)"
    />

    <div
      v-if="modelValue.background_type"
      class="preview-strip q-mt-sm"
      :style="{ ...previewStyle, color: modelValue.text_color || undefined }"
    >
      {{ tdc('Preview') }}
    </div>
  </s-card>
</template>

<style scoped>
.image-preview {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  display: block;
  object-fit: cover;
}

.preview-strip {
  padding: 14px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid rgba(128, 128, 128, .2);
}
</style>
