<template>

  <q-btn
    v-bind="btnAttrs"

    :label="translatedLabel"

    :dense="attrs.dense ?? layout.button_dense"
    :round="attrs.round ?? layout.button_round"

    :flat="attrs.flat ?? layout.button_style === 'flat'"
    :outline="attrs.outline ?? layout.button_style === 'outline'"
    :unelevated="attrs.unelevated ?? layout.button_style === 'unelevated'"
    :push="attrs.push ?? layout.button_style === 'push'"

    :loading="attrs.loading"

    :ripple="animation.button_animation === 'ripple'"

    :class="[
      's-btn',
      attrs.class,
      animation.hover_effect ? 'hover-' + animation.hover_style : '',
      animation.button_animation === 'pulse' ? 'btn-anim-pulse' : ''
    ]"
  >

    <slot/>

  </q-btn>

</template>

<script>

import { defineComponent, computed, useAttrs, watch } from "vue"
import { UserStore } from "./../../stores/AuthStore"
import { tdc } from "../../boot/base"

export default defineComponent({

  name:"s-btn",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = UserStore()

    const layout = computed(()=>User.ps?.layout || {})
    const animation = computed(()=>User.ps?.animation || {})

    // --------------------------
    // 🎨 THEME ENGINE (🔥 IGUAL AOS OUTROS)
    // --------------------------

    const applyTheme = (v) => {

      let radius = "4px"

      if (v?.border_radius) {
        radius = v.border_radius
      } else {
        switch (v?.mode) {
          case "square":
            radius = "0px"
            break
          case "rounded":
            radius = "16px"
            break
          case "soft":
            radius = "8px"
            break
          case "pill":
            radius = "999px"
            break
          default:
            radius = "4px"
        }
      }

      document.documentElement.style.setProperty("--s-radius", radius)
    }

    watch(layout, applyTheme, { immediate: true, deep: true })

    // --------------------------
    // 🌍 TRANSLATION
    // --------------------------

    const translatedLabel = computed(()=>{
      return attrs.label ? tdc(attrs.label) : undefined
    })

    // --------------------------
    // 🎛️ ATTRS
    // --------------------------

    const btnAttrs = computed(()=>{

      const {
        label,
        ...rest
      } = attrs

      return rest

    })

    return{
      attrs,
      layout,
      animation,
      translatedLabel,
      btnAttrs
    }

  }

})
   
</script>

<style scoped>
/* 🔥 botão aceita direto */
.s-btn {
  border-radius: var(--s-radius) !important;
  background: var(--btn-primary);
  color: var(--btn-primary-text);
}

/* opcional: garantir também no conteúdo interno */
.s-btn :deep(.q-btn__content) {
  border-radius: inherit;
}

/* animação exemplo */
.btn-anim-pulse {
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>