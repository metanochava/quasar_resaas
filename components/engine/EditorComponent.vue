<template>
  <div class="s-editor-wrapper">
    <q-editor
      v-bind="editorAttrs"
      v-model="localValue"
      :placeholder="translatedPlaceholder"
      :toolbar="computedToolbar"
      :definitions="computedDefinitions"
      :min-height="computedMinHeight"
      :max-height="attrs.maxHeight"
      :height="attrs.height"
      :dense="attrs.dense??layout.dense"
      :class="['s-editor',attrs.class,{'s-editor--error':hasError}]"
    />
    <div v-if="translatedHint&&!hasError" class="s-editor-hint">{{translatedHint}}</div>
    <div v-if="hasError" class="s-editor-error">{{firstError}}</div>
  </div>
</template>

<script>
import {defineComponent,computed,useAttrs,ref,watch} from "vue"
import {useUserStore} from "../../stores/UserStore"
import {tdc} from "../../services/translation"

export default defineComponent({
  name:"s-editor",
  inheritAttrs:false,
  props:{
    modelValue:{type:String,default:""},
    label:String,
    placeholder:String,
    hint:String,
    required:Boolean,
    validators:{type:Array,default:()=>[]},
    toolbar:{type:Array,default:null},
    minHeight:{type:String,default:"180px"},
    error:{type:[Boolean,String],default:false},
    errorMessage:{type:String,default:""}
  },
  emits:["update:modelValue"],
  setup(props,{emit}){
    const attrs=useAttrs(),User=useUserStore()
    const layout=computed(()=>User.ps?.layout||{})
    const localValue=ref(props.modelValue||"")
    const localHasError=ref(false),localFirstError=ref("")

    const translatedLabel=computed(()=>{
      const label=props.label||attrs.label||attrs.name||""
      return label?tdc(label):""
    })

    const translatedPlaceholder=computed(()=>{
      const value=props.placeholder||attrs.placeholder
      return value?tdc(value):undefined
    })

    const translatedHint=computed(()=>{
      const value=props.hint||attrs.hint
      return value?tdc(value):undefined
    })

    const hasError=computed(()=>localHasError.value||!!props.error)

    const firstError=computed(()=>
      localFirstError.value||
      (typeof props.error==="string"&&props.error)||
      props.errorMessage||
      ""
    )

    const computedDefinitions=computed(()=>{
      const label=translatedLabel.value
      return{
        fieldLabel:{
          label:`${label}${props.required?" *":""}`,
          tip:label,
          disable:true
        }
      }
    })

    const computedToolbar=computed(()=>props.toolbar||[
      ["fieldLabel","bold","italic","strike","underline"],
      ["left","center","right","justify"],
      ["unordered","ordered","outdent","indent"],
      ["undo","redo","fullscreen"]
    ])

    const computedMinHeight=computed(()=>attrs.minHeight||props.minHeight)

    const editorAttrs=computed(()=>{
      const {class:klass,label,placeholder,hint,minHeight,maxHeight,height,name,...rest}=attrs
      return rest
    })

    function stripHtml(value){
      return String(value||"").replace(/<[^>]*>/g,"").replace(/&nbsp;/gi," ").trim()
    }

    function validate(value){
      const rules=[]
      if(props.required)rules.push(v=>!!stripHtml(v)||tdc("Required field"))
      rules.push(...props.validators)

      for(const rule of rules){
        if(typeof rule!=="function")continue
        const result=rule(value)
        if(result!==true){
          localHasError.value=true
          localFirstError.value=typeof result==="string"?result:tdc("Invalid value")
          return false
        }
      }

      localHasError.value=false
      localFirstError.value=""
      return true
    }

    watch(()=>props.modelValue,value=>{
      const next=value||""
      if(next!==localValue.value)localValue.value=next
    })

    watch(localValue,value=>{
      emit("update:modelValue",value)
      validate(value)
    })

    return{
      attrs,
      layout,
      localValue,
      translatedPlaceholder,
      translatedHint,
      computedDefinitions,
      computedToolbar,
      computedMinHeight,
      hasError,
      firstError,
      editorAttrs
    }
  }
})
</script>

<style scoped>
.s-editor-wrapper{width:100%}
.s-editor{width:100%}
.s-editor--error{border:1px solid var(--q-negative);border-radius:4px}
.s-editor-hint{font-size:12px;color:#777;margin-top:4px}
.s-editor-error{font-size:12px;color:var(--q-negative);margin-top:4px}
</style>