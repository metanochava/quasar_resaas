<script setup>
import { computed } from 'vue'

import { highlightSegments } from '../../utils/highlight'

// Text with the part matching `search` highlighted (utils/highlight.js:
// case- and accent-insensitive). No v-html: the text is rendered as text.
const props = defineProps({
  text: { type: [String, Number], default: '' },
  search: { type: String, default: '' }
})

const segments = computed(() => highlightSegments(props.text, props.search))
</script>

<template>
  <span class="s-highlight"><template v-for="(segment, index) in segments" :key="index"><mark
    v-if="segment.match"
    class="s-highlight__match"
    data-test="search-match"
  >{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></span>
</template>

<style>
.s-highlight__match {
  background: rgba(255, 193, 7, 0.45);
  color: inherit;
  font-weight: 700;
  border-radius: 3px;
  padding: 0 1px;
}

.body--dark .s-highlight__match {
  background: rgba(255, 193, 7, 0.35);
}
</style>
