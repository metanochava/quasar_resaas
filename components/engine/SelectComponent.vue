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

    :dense="attrs.dense ?? layout.input_dense"

    :outlined="attrs.outlined ?? layout.input_style === 'outlined'"
    :filled="attrs.filled ?? layout.input_style === 'filled'"

    :class="attrs.class"

    @filter="onFilter"

    @virtual-scroll="onScroll"
  >
    <slot/>
  </q-select>

</template>

<script>
import { defineComponent, computed, useAttrs, ref, watch, onMounted } from "vue"
import { useUserStore } from "../../stores/AuthStore"
import { tdc } from "../../boot/base"
import { HTTPAuth } from "../../boot/api"

export default defineComponent({

  name:"s-select",
  inheritAttrs:false,

  props:{
    modelValue:[String,Number,Object,Array],
    options:Array,
    api:String
  },

  emits:["update:modelValue"],

  setup(props,{emit}){

    const attrs = useAttrs()
    const User = useUserStore()

    const layout = computed(()=>User.ps?.layout || {})

    const localValue = ref(props.modelValue)

    const optionsList = ref([])
    const loading = ref(false)

    const nextPageUrl = ref(null)
    const searchRef = ref("")
    const loadingMore = ref(false)

    // --------------------------
    // 🔑 LABEL
    // --------------------------

    const optionLabelKey = computed(() => attrs["option-label"])

    const getLabel = (o) => {
      if (!o) return ""

      if (typeof optionLabelKey.value === "function") {
        return optionLabelKey.value(o)
      }

      if (typeof optionLabelKey.value === "string") {
        return o?.[optionLabelKey.value] ?? ""
      }

      return o?.label ?? ""
    }

    // --------------------------
    // 🔁 MODEL
    // --------------------------

    watch(localValue,(v)=>{
      emit("update:modelValue",v)
    })

    watch(()=>props.modelValue,(v)=>{
      localValue.value=v
    })

    // --------------------------
    // 🌐 FETCH PAGE
    // --------------------------

    const fetchPage = async(urlOverride = null, search = "") => {

      if (!props.api && !urlOverride) return

      loading.value = true

      try{

        const url = urlOverride || props.api

        const r = await HTTPAuth.get(url,{
          params: urlOverride ? {} : { search }
        })

        const data = r.data

        const results = data.results ?? data

        if (urlOverride) {
          // append
          optionsList.value = [...optionsList.value, ...results]
        } else {
          // reset
          optionsList.value = results
        }

        nextPageUrl.value = data.next

      }catch(e){
        console.error("Pagination error:", e)
      }

      loading.value = false
      loadingMore.value = false

    }

    // --------------------------
    // 🔍 FILTER
    // --------------------------

    const onFilter = (val, update) => {

      update(async () => {

        searchRef.value = val

        if (props.api) {
          await fetchPage(null, val)
        } else {
          const search = (val || "").toLowerCase()

          optionsList.value = (props.options || []).filter(o => {
            return String(getLabel(o)).toLowerCase().includes(search)
          })
        }

      })

    }

    // --------------------------
    // 📜 SCROLL (INFINITE)
    // --------------------------

    const onScroll = async ({ to }) => {

      if (!props.api) return

      const lastIndex = optionsList.value.length - 1

      // chegou perto do fim
      if (to >= lastIndex - 5 && nextPageUrl.value && !loadingMore.value) {

        loadingMore.value = true

        await fetchPage(nextPageUrl.value, searchRef.value)
      }
    }

    // --------------------------
    // 🚀 INIT
    // --------------------------

    onMounted(()=>{

      if(props.api){
        fetchPage()
      }else{
        optionsList.value = props.options || []
      }

    })

    // --------------------------
    // 🌍 UI
    // --------------------------

    const translatedLabel = computed(()=>{
      return attrs.label ? tdc(attrs.label) : undefined
    })

    const translatedPlaceholder = computed(()=>{
      return attrs.placeholder ? tdc(attrs.placeholder) : undefined
    })

    const selectAttrs = computed(()=>{

      const {
        label,
        placeholder,
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

      selectAttrs,

      onFilter,
      onScroll
    }

  }

})
</script>