<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'
import { surfaceToStyle } from '../../theme/surfaceToStyle.js'
import ColorField from './ColorField.vue'
import GradientBuilder from './GradientBuilder.vue'

// Editor genérico de UMA área visual (ThemeSurface) - background
// cor/gradiente/imagem/transparente + tamanho/posição/repetição (para
// imagem) + opacidade + overlay + blur.
//
// Alinhado a django_resaas.saas.models.theme_surface.ThemeSurface (a
// única fonte de verdade para aparência de áreas - CLAUDE.md secção
// 5/21: já não existe `entity.header_background_type` /
// `entity.footer_background_type` / `entity.login_background_type`).
// ThemeSurface não tem um campo de cor de texto próprio - isso continua
// a viver no Theme (header_text/footer_text/sidebar_text), por isso
// este editor não lida com texto.

const props = defineProps({
  modelValue: { type: Object, required: true },
  label: { type: String, default: '' },
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

const sizeOptions = [
  { label: tdc('Auto'), value: 'auto' },
  { label: tdc('Cover'), value: 'cover' },
  { label: tdc('Contain'), value: 'contain' },
  { label: tdc('Stretch'), value: '100% 100%' },
]

const positionOptions = [
  { label: tdc('Center'), value: 'center' },
  { label: tdc('Top'), value: 'top' },
  { label: tdc('Bottom'), value: 'bottom' },
  { label: tdc('Left'), value: 'left' },
  { label: tdc('Right'), value: 'right' },
  { label: tdc('Top left'), value: 'top left' },
  { label: tdc('Top right'), value: 'top right' },
  { label: tdc('Bottom left'), value: 'bottom left' },
  { label: tdc('Bottom right'), value: 'bottom right' },
]

const previewImageUrl = computed(() => {
  const image = props.modelValue.background_image
  if (image instanceof File) return URL.createObjectURL(image)
  return image || props.modelValue.background_value || null
})

const previewStyle = computed(() => surfaceToStyle({
  ...props.modelValue,
  background_image: previewImageUrl.value,
}))
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

      <div class="row q-col-gutter-sm q-mt-sm">
        <s-select
          class="col-12 col-sm-4"
          :model-value="modelValue.background_size"
          :options="sizeOptions" emit-value map-options
          :label="tdc('Size')"
          @update:model-value="set('background_size', $event)"
        />

        <s-select
          class="col-12 col-sm-4"
          :model-value="modelValue.background_position"
          :options="positionOptions" emit-value map-options
          :label="tdc('Position')"
          @update:model-value="set('background_position', $event)"
        />

        <div class="col-12 col-sm-4 flex items-center">
          <s-switch
            :model-value="!!modelValue.background_repeat"
            :label="tdc('Repeat')"
            @update:model-value="set('background_repeat', $event)"
          />
        </div>
      </div>
    </div>

    <div v-if="['color', 'gradient', 'image'].includes(modelValue.background_type)" class="q-mb-sm">
      <div class="text-caption text-grey-7">{{ tdc('Opacity') }}</div>
      <q-slider
        :model-value="modelValue.background_opacity ?? 1"
        :min="0" :max="1" :step="0.05" label color="primary"
        @update:model-value="set('background_opacity', $event)"
      />
    </div>

    <div v-if="['gradient', 'image'].includes(modelValue.background_type)" class="q-mb-sm">
      <div class="text-caption text-grey-7">{{ tdc('Dark overlay') }}</div>
      <q-slider
        :model-value="modelValue.background_overlay || 0"
        :min="0" :max="1" :step="0.05" label color="primary"
        @update:model-value="set('background_overlay', $event)"
      />
    </div>

    <div v-if="modelValue.background_type === 'image'" class="q-mb-sm">
      <div class="text-caption text-grey-7">{{ tdc('Backdrop blur') }} ({{ modelValue.backdrop_blur || 0 }}px)</div>
      <q-slider
        :model-value="modelValue.backdrop_blur || 0"
        :min="0" :max="40" :step="1" label color="primary"
        @update:model-value="set('backdrop_blur', $event)"
      />
    </div>

    <div
      v-if="modelValue.background_type"
      class="preview-strip q-mt-sm"
      :style="previewStyle"
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
  position: relative;
}
</style>
