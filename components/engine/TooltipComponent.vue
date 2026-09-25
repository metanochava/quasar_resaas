<template>

  <q-tooltip
    v-bind="attrs"

    :class="[
      attrs.class || ($q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white ')
    ]"
  >
    <slot/>
  </q-tooltip>

</template>

<script>

import { defineComponent, useAttrs } from 'vue'

// Every <q-tooltip> in the app hand-duplicated the same
// $q.dark.isActive ? 'bg-dark text-white ' : 'bg-primary text-white '
// ternary (HeaderUser.vue, PdfRender.vue, AutoForm.vue, ...) - this is
// that pattern as the shared default, still overridable per call site
// via an explicit `class` prop.
export default defineComponent({

  name: "s-tooltip",
  inheritAttrs: false,

  // $q in the template is Quasar's global property: returning it from setup()
  // made Vue warn ("$" is a reserved prefix)
  setup(){

    const attrs = useAttrs()

    return{
      attrs
    }

  }

})
</script>
