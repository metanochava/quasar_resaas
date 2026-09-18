<template>
  <div class="s-file">
    <div v-if="translatedLabel||translatedHint||hasError" class="s-file-meta">
      <div v-if="translatedLabel" class="text-caption text-grey-7">{{translatedLabel}}</div>
      <div v-if="hasError" class="text-negative text-caption">{{firstError}}</div>
      <div v-else-if="translatedHint" class="text-caption text-grey-6">{{translatedHint}}</div>
    </div>

    <input ref="nativeInput" type="file" class="s-file-native-input" :accept="accept" :multiple="multiple" @change="onFileChange">

    <div class="row items-center q-gutter-sm">
      <div v-for="item in previewItems" :key="item.key" class="s-file-preview-item column items-center">
        <div class="s-file-preview-thumb" :style="radiusStyle">
          <img v-if="item.type==='image'" :src="item.src" :alt="item.name">
          <q-icon v-else-if="item.type==='pdf'" name="picture_as_pdf" size="32px"/>
          <q-icon v-else name="insert_drive_file" size="32px"/>
        </div>
        <div class="s-file-preview-name text-caption ellipsis">{{item.name}}</div>
        <div class="row q-gutter-xs">
          <s-btn v-if="!multiple" flat round dense size="sm" color="primary" icon="edit" @click="openAdd">
            <s-tooltip>{{tdc('Change')}}</s-tooltip>
          </s-btn>
          <s-btn flat round dense size="sm" color="negative" icon="delete" @click="removeAt(item.index)">
            <s-tooltip>{{tdc('Remove')}}</s-tooltip>
          </s-btn>
        </div>
      </div>

      <s-btn v-if="multiple||!previewItems.length" round outline color="primary" icon="add" @click="isImageField?(addMenuOpen=true):openAdd()">
        <s-tooltip>{{tdc('Add')}}</s-tooltip>
        <q-menu v-if="isImageField" v-model="addMenuOpen">
          <q-list dense style="min-width:160px">
            <q-item clickable v-close-popup @click="openAdd">
              <q-item-section avatar><q-icon name="upload"/></q-item-section>
              <q-item-section>{{tdc('Choose file')}}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="cameraOpen=true">
              <q-item-section avatar><q-icon name="photo_camera"/></q-item-section>
              <q-item-section>{{tdc('Use camera')}}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </s-btn>
    </div>

    <CameraCaptureDialog v-if="isImageField" v-model="cameraOpen" @captured="onCameraCaptured"/>
  </div>
</template>

<script>
import {defineComponent,computed,ref,watch,useAttrs,onBeforeUnmount} from "vue"
import {useUserStore} from "../../stores/UserStore.js"
import {tdc} from "../../services/translation.js"
import {resolvePreview} from "../../utils/filePreview.js"
import CameraCaptureDialog from "./CameraCaptureDialog.vue"

const IMAGE_EXTENSIONS=/\.(png|jpe?g|gif|webp|bmp|heic|heif)\b/i
const looksLikeImageAccept=accept=>!!accept&&(accept.includes("image/")||IMAGE_EXTENSIONS.test(accept))

export default defineComponent({
  name:"s-file",
  inheritAttrs:false,
  components:{CameraCaptureDialog},
  props:{
    modelValue:{type:[Object,Array,File],default:null},
    label:String,
    hint:String,
    required:Boolean,
    multiple:{type:Boolean,default:false},
    maxSize:{type:Number,default:null},
    error:{type:[Boolean,String],default:false},
    errorMessage:{type:String,default:""}
  },
  emits:["update:modelValue"],
  setup(props,{emit}){
    const attrs=useAttrs(),User=useUserStore(),nativeInput=ref(null),localValue=ref(props.modelValue),addMenuOpen=ref(false),cameraOpen=ref(false),blobUrls=new Set()
    const layout=computed(()=>User.ps?.layout||{})
    const accept=computed(()=>attrs.accept||"")
    const translatedLabel=computed(()=>props.label?tdc(props.label):undefined)
    const translatedHint=computed(()=>props.hint?tdc(props.hint):undefined)
    const isImageField=computed(()=>looksLikeImageAccept(accept.value))
    const hasError=computed(()=>!!props.error)
    const firstError=computed(()=>(typeof props.error==="string"&&props.error)||props.errorMessage||"")
    const radiusStyle=computed(()=>({borderRadius:layout.value.rounded?"16px":"4px"}))

    watch(()=>props.modelValue,v=>localValue.value=v)
    watch(localValue,v=>emit("update:modelValue",v))

    const previewItems=computed(()=>{
      const values=Array.isArray(localValue.value)?localValue.value:(localValue.value?[localValue.value]:[])
      return values.map((value,index)=>{
        const preview=resolvePreview(value)
        if(!preview)return null
        if(preview.isBlobUrl)blobUrls.add(preview.src)
        return {...preview,index,key:value instanceof File?`${value.name}-${value.size}-${value.lastModified}`:(value?.url||index)}
      }).filter(Boolean)
    })

    function openAdd(){
      if(!nativeInput.value)return
      nativeInput.value.value=""
      nativeInput.value.click()
    }

    function validateFile(file){
      if(!file)return false
      if(props.maxSize&&file.size>props.maxSize){
        const maxMb=(props.maxSize/(1024*1024)).toFixed(1)
        return `${tdc("File too large - max")} ${maxMb}MB`
      }
      return true
    }

    function onFileChange(event){
      const files=Array.from(event.target.files||[])
      if(!files.length)return
      const valid=[]
      for(const file of files){
        const result=validateFile(file)
        if(result===true)valid.push(file)
        else{
          event.target.value=""
          return
        }
      }
      if(props.multiple){
        const current=Array.isArray(localValue.value)?localValue.value:(localValue.value?[localValue.value]:[])
        localValue.value=[...current,...valid]
      }else localValue.value=valid[0]||null
      event.target.value=""
    }

    function onCameraCaptured(file){
      if(!file)return
      const result=validateFile(file)
      if(result!==true)return
      if(props.multiple){
        const current=Array.isArray(localValue.value)?localValue.value:(localValue.value?[localValue.value]:[])
        localValue.value=[...current,file]
      }else localValue.value=file
    }

    function removeAt(index){
      if(Array.isArray(localValue.value))localValue.value=localValue.value.filter((_,i)=>i!==index)
      else localValue.value=null
      if(nativeInput.value)nativeInput.value.value=""
    }

    onBeforeUnmount(()=>blobUrls.forEach(url=>URL.revokeObjectURL(url)))

    return{nativeInput,localValue,addMenuOpen,cameraOpen,accept,translatedLabel,translatedHint,isImageField,hasError,firstError,radiusStyle,previewItems,openAdd,onFileChange,onCameraCaptured,removeAt,tdc}
  }
})
</script>

<style scoped>
.s-file{position:relative}
.s-file-native-input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}
.s-file-preview-thumb{width:64px;height:64px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:rgba(128,128,128,.12)}
.s-file-preview-thumb img{width:100%;height:100%;object-fit:cover}
.s-file-preview-item{width:72px}
.s-file-preview-name{max-width:72px}
.s-file-meta{margin-bottom:4px}
</style>