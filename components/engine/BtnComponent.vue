<template>

  <q-btn
    v-bind="btnAttrs"
    :label="iconOnly ? undefined : translatedLabel"
    :icon="icon"
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
    <!-- the label hidden on a small screen: it becomes the tooltip when the
         button brings none of its own -->
    <q-tooltip v-if="iconOnly && !$slots.default && labelText">{{ labelText }}</q-tooltip>

  </q-btn>

</template>

<script>

import { defineComponent, computed, useAttrs } from "vue"
import { useQuasar } from "quasar"
import { useUserStore } from "../../stores/UserStore"
import { unwrapChoice } from "../../theme/unwrapChoice.js"
import { tdc } from "../../services/translation"


export default defineComponent({

  name:"s-btn",
  inheritAttrs:false,

  setup(){

    const attrs = useAttrs()
    const User = useUserStore()
    const $q = useQuasar()

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

    // owner rule: on a small screen (xs) a button with an icon shows only the
    // icon - the text goes to its tooltip. `keep-label` opts out.
    // owner rule: Cancel / Close / Reset always carry a suggestive icon (the
    // canonical English label, before translation); an icon given wins
    // canonical English label, or the same already translated (a caller may
    // pass tdc('Cancel') = "Cancelar")
    const DEFAULT_ICONS = { Cancel: "close", Close: "close", Reset: "restart_alt" }
    const icon = computed(() => {
      if (attrs.icon) return attrs.icon
      const label = String(attrs.label || "").trim().toLowerCase()
      if (!label) return undefined
      const hit = Object.entries(DEFAULT_ICONS).find(([text]) =>
        label === text.toLowerCase() || label === String(tdc(text) || "").trim().toLowerCase()
      )
      return hit ? hit[1] : undefined
    })

    const keepLabel = computed(() => attrs['keep-label'] !== undefined && attrs['keep-label'] !== false)
    const iconOnly = computed(() =>
      Boolean($q?.screen?.xs && (icon.value || attrs['icon-right']) && translatedLabel.value && !keepLabel.value)
    )
    const labelText = computed(() => translatedLabel.value || '')

    // --------------------------
    // 🎛️ ATTRS
    // --------------------------

    const btnAttrs = computed(()=>{

      const {
        label,
        icon: _icon,
        'keep-label': _keepLabel,
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
      icon,
      iconOnly,
      labelText,
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
