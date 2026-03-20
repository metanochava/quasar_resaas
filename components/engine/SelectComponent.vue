<template>

  <q-select
    v-bind="selectAttrs"

    v-model="localValue"

    use-input
    input-debounce="300"

    :options="optionsList"

    :loading="loading"

    :multiple="attrs.multiple"
    :use-chips="attrs.multiple"

    :label="translatedLabel"
    :placeholder="translatedPlaceholder"
    :hint="translatedHint"
    :error-message="translatedError"

    :dense="attrs.dense ?? layout.input_dense"

    :outlined="attrs.outlined ?? layout.input_style === 'outlined'"
    :filled="attrs.filled ?? layout.input_style === 'filled'"
    :standout="attrs.standout ?? layout.input_style === 'standout'"

    :class="['s-select', attrs.class]"

    @filter="onFilter"
  >
    <slot/>
  </q-select>

</template>

<script>

import { defineComponent, computed, useAttrs, ref, watch, onMounted } from "vue"
import { UserStore } from "../../stores/AuthStore"
import { tdc } from "../../boot/base"
import { HTTPAuth } from "../../boot/api"

export default defineComponent({

  name:"s-select",
  inheritAttrs:false,

  props:{
    modelValue:[String,Number,Object,Array],

    options:{
      type:Array,
      default:()=>[]
    },

    api:{
      type:String,
      default:null
    },

    reload:{
      type:Number,
      default:0
    }
  },

  emits:["update:modelValue"],

  setup(props,{emit}){

    const attrs = useAttrs()
    const User = UserStore()

    const layout = computed(()=>User.ps?.layout || {})

    const localValue = ref(props.modelValue)

    const optionsList = ref([])
    const loading = ref(false)

    const cache = {}

    // --------------------------
    // 🎨 THEME ENGINE (🔥 FINAL)
    // --------------------------

    const applyTheme = (v) => {

      let radius = "4px" // fallback

      // prioridade 1 → valor direto do backend
      if (v?.border_radius) {
        radius = v.border_radius
      }

      // prioridade 2 → modo
      else {
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
    // 🔑 OPTION CONFIG
    // --------------------------

    const optionLabelKey = computed(() => attrs["option-label"])
    const optionValueKey = computed(() => attrs["option-value"])

    const getLabel = (o) => {
      if (!o) return ""

      if (typeof optionLabelKey.value === "function") {
        return optionLabelKey.value(o)
      }

      if (typeof optionLabelKey.value === "string") {
        return o?.[optionLabelKey.value] ?? ""
      }

      if (typeof o === "string") return o
      if (typeof o.label === "string") return o.label

      return ""
    }

    // --------------------------
    // 🔁 WATCHERS
    // --------------------------

    watch(localValue,(v)=>{
      emit("update:modelValue",v)
    })

    watch(()=>props.modelValue,(v)=>{
      localValue.value=v
    })

    watch(()=>props.reload,()=>{
      fetchOptions("")
    })

    // --------------------------
    // 🌐 API FETCH
    // --------------------------

    const fetchOptions = async(search)=>{

      if(!props.api) return

      if(cache[search]){
        optionsList.value = cache[search]
        return
      }

      loading.value = true

      try{
        const r = await HTTPAuth.get(props.api,{
          params:{search}
        })

        const data = r.data.results ?? r.data

        optionsList.value = data || []

        cache[search] = optionsList.value

      }catch(e){
        console.error("Select API error:", e)
        optionsList.value = []
      }

      loading.value=false

    }

    // --------------------------
    // 🔍 FILTER
    // --------------------------

    const onFilter=(val,update)=>{

      update(async()=>{

        const search = (val || "").toLowerCase()

        if(props.api){
          await fetchOptions(val)
        }else{
          optionsList.value = (props.options || []).filter(o => {
            const label = String(getLabel(o)).toLowerCase()
            return label.includes(search)
          })
        }

      })

    }

    // --------------------------
    // 🚀 INIT
    // --------------------------

    onMounted(()=>{

      if(props.api){
        fetchOptions("")
      }else{
        optionsList.value = props.options
      }

    })

    // --------------------------
    // 🌍 TRANSLATIONS
    // --------------------------

    const translatedLabel = computed(()=>{
      return attrs.label ? tdc(attrs.label) : undefined
    })

    const translatedPlaceholder = computed(()=>{
      return attrs.placeholder ? tdc(attrs.placeholder) : undefined
    })

    const translatedHint = computed(()=>{
      return attrs.hint ? tdc(attrs.hint) : undefined
    })

    const translatedError = computed(()=>{
      return attrs["error-message"] ? tdc(attrs["error-message"]) : undefined
    })

    const selectAttrs = computed(()=>{

      const {
        label,
        placeholder,
        hint,
        "error-message": errorMessage,
        ...rest
      } = attrs

      return rest

    })

    return{

      attrs,
      layout,

      localValue,

      optionsList,
      loading,

      translatedLabel,
      translatedPlaceholder,
      translatedHint,
      translatedError,

      selectAttrs,

      onFilter

    }

  }

})
</script>

<style scoped>
/* 🔥 aplica no elemento correto do Quasar */
.s-select :deep(.q-field__control) {
  border-radius: var(--s-radius, 4px) !important;
}
</style>