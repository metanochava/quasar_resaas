<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

const props = defineProps({
  widget: { type: Object, required: true },
  data: { type: Object, required: true },
})

const direction = computed(() => {
  if (props.data.variation_direction) return props.data.variation_direction
  if (props.data.variation > 0) return 'up'
  if (props.data.variation < 0) return 'down'
  return 'neutral'
})

const variationColor = computed(() => ({
  up: 'positive', down: 'negative', neutral: 'grey-6',
}[direction.value]))

const variationIcon = computed(() => ({
  up: 'arrow_upward', down: 'arrow_downward', neutral: 'remove',
}[direction.value]))

const formattedValue = computed(() =>
  props.data.formatted_value ?? props.data.value ?? '-'
)
</script>

<template>
  <div
    class="row items-center no-wrap"
    :class="{ 'cursor-pointer': widget.route || widget.link }"
  >
    <q-avatar
      v-if="widget.icon"
      :color="widget.color || 'primary'" text-color="white"
      :icon="widget.icon" size="42px" class="q-mr-md"
    />

    <div>
      <div class="text-h5 text-weight-bold">
        <span v-if="widget.prefix">{{ widget.prefix }}</span>{{ formattedValue }}<span v-if="widget.unit || widget.suffix">{{ widget.unit || widget.suffix }}</span>
      </div>

      <div
        v-if="data.variation !== undefined && data.variation !== null"
        class="text-caption row items-center q-gutter-xs"
        :class="`text-${variationColor}`"
      >
        <q-icon :name="variationIcon" size="14px" />
        <span>{{ Math.abs(data.variation) }}%</span>
        <span v-if="data.comparison_label" class="text-grey-6">{{ tdc(data.comparison_label) }}</span>
      </div>

      <div v-if="data.last_updated" class="text-caption text-grey-5">
        {{ tdc('Updated') }}: {{ data.last_updated }}
      </div>
    </div>
  </div>
</template>
