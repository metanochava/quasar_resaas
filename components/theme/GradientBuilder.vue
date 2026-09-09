<script setup>
import { computed, ref, watch } from 'vue'
import { tdc } from '../../services/translation'
import ColorField from './ColorField.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function parseGradient(css) {
  if (!css) return null

  const match = css.match(/linear-gradient\(([^)]+)\)/)
  if (!match) return null

  const parts = match[1].split(',').map((s) => s.trim())
  let angleValue = 135
  let colorParts = parts

  if (/deg$/.test(parts[0])) {
    angleValue = parseFloat(parts[0])
    colorParts = parts.slice(1)
  }

  const parsedStops = colorParts
    .map((part, i) => {
      const [color, pos] = part.split(/\s+/)
      if (!color) return null
      return {
        color,
        position: pos ? parseFloat(pos) : Math.round((i / Math.max(colorParts.length - 1, 1)) * 100),
      }
    })
    .filter(Boolean)

  return parsedStops.length >= 2 ? { angle: angleValue, stops: parsedStops } : null
}

const initial = parseGradient(props.modelValue)

const angle = ref(initial?.angle ?? 135)
const stops = ref(initial?.stops ?? [
  { color: '#1976D2', position: 0 },
  { color: '#26A69A', position: 100 },
])

const cssValue = computed(() => {
  const stopsCss = [...stops.value]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color || '#000000'} ${s.position}%`)
    .join(', ')

  return `linear-gradient(${angle.value}deg, ${stopsCss})`
})

watch(cssValue, (val) => emit('update:modelValue', val), { immediate: true })

function addStop() {
  stops.value.push({ color: '#ffffff', position: 50 })
}

function removeStop(index) {
  if (stops.value.length <= 2) return
  stops.value.splice(index, 1)
}
</script>

<template>
  <div class="gradient-builder">
    <div class="gradient-preview q-mb-md" :style="{ background: cssValue }" />

    <div class="q-mb-md">
      <div class="text-caption text-grey-7">{{ tdc('Angle') }}: {{ angle }}°</div>
      <q-slider v-model="angle" :min="0" :max="360" color="primary" />
    </div>

    <div
      v-for="(stop, i) in stops" :key="i"
      class="row items-center no-wrap q-gutter-sm q-mb-sm"
    >
      <ColorField v-model="stop.color" class="col" />

      <q-input
        v-model.number="stop.position"
        type="number" dense outlined suffix="%"
        :min="0" :max="100"
        style="width: 100px"
      />

      <q-btn
        v-if="stops.length > 2"
        flat dense round icon="close" size="sm" color="negative"
        @click="removeStop(i)"
      />
    </div>

    <q-btn flat dense no-caps icon="add" :label="tdc('Add color stop')" size="sm" color="primary" @click="addStop" />
  </div>
</template>

<style scoped>
.gradient-preview {
  height: 56px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, .35);
}
</style>
