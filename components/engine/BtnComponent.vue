<template>

  <q-btn
    v-bind="btnAttrs"
    :label="translatedLabel"
    :dense="attrs.dense ?? layout.dense"
    :round="attrs.round ?? false"
    :unelevated="defaultUnelevated"
    :loading="attrs.loading"
    :ripple="buttonAnimation === 'ripple'"
    :class="[
      attrs.class,
      animation.hover_effect ? 'hover-' + hoverStyle : '',
      buttonAnimation === 'pulse' ? 'btn-anim-pulse' : ''
    ]"
  >

    <slot/>

  </q-btn>

</template>

<script>

import { defineComponent, computed, useAttrs } from "vue"
import { useUserStore } from "../../stores/UserStore"
import { unwrapChoice } from "../../theme/unwrapChoice.js"
import { tdc } from "../../services/translation"


export default defineComponent({

  name:"s-btn",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = useUserStore()

    // LayoutSetting só expõe `dense`/`rounded` como flags globais de
    // estilo (django_resaas.saas.models.layout_setting.LayoutSetting) -
    // já não existem button_dense/button_round/button_style. O raio
    // global (--s-radius) já é aplicado uma única vez por
    // theme/applyLayout.js, não aqui por instância de botão.
    const layout = computed(()=>User.ps?.layout || {})
    const animation = computed(()=>User.ps?.animation || {})

    const buttonAnimation = computed(() => unwrapChoice(animation.value.button_animation))
    const hoverStyle = computed(() => unwrapChoice(animation.value.hover_style))

    // unelevated é o estilo por omissão (igual ao antigo
    // LayoutSetting.button_style default "unelevated") - só quando o
    // chamador não pediu explicitamente flat/outline/push/unelevated.
    const defaultUnelevated = computed(() =>
      attrs.unelevated ?? (
        attrs.flat === undefined &&
        attrs.outline === undefined &&
        attrs.push === undefined
      )
    )

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
      buttonAnimation,
      hoverStyle,
      defaultUnelevated,
      translatedLabel,
      btnAttrs
    }

  }

})

</script>

<style scoped>

/* example animation */
.btn-anim-pulse {
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>
