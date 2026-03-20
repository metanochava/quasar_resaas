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

    :class="attrs.class"

    :style="{
      borderRadius: layout.square
        ? '0px'
        : layout.rounded
        ? '16px'
        : '4px'
    }"

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

    watch(localValue,(v)=>{
      emit("update:modelValue",v)
    })

    watch(()=>props.modelValue,(v)=>{
      localValue.value=v
    })

    watch(()=>props.reload,()=>{
      fetchOptions("")
    })

    const fetchOptions = async(search)=>{

      if(!props.api) return

      if(cache[search]){
        optionsList.value = cache[search]
        return
      }

      loading.value = true

      const r = await HTTPAuth.get(props.api,{
        params:{search}
      })

      const data = r.data.results ?? r.data

      optionsList.value = data.map(o=>({

        label: tdc(o.label ?? o.name ?? o.nome),
        value: o.id ?? o.value ?? o

      }))

      cache[search] = optionsList.value

      loading.value=false

    }

    const onFilter=(val,update)=>{

      update(async()=>{

        if(props.api){

          await fetchOptions(val)

        }else{

          optionsList.value = props.options.filter(o=> (o.label ?? o)?.toLowerCase()?.includes(val.toLowerCase()))

        }

      })

    }

    onMounted(()=>{

      if(props.api){
        fetchOptions("")
      }else{
        optionsList.value = props.options
      }

    })

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