<template>
  <div class="s-file">
    <div v-if="translatedLabel||translatedHint||hasError" class="s-file-meta">
      <div v-if="translatedLabel" class="text-caption text-grey-7">{{translatedLabel}}</div>
      <div v-if="hasError" class="text-negative text-caption">{{firstError}}</div>
      <div v-else-if="translatedHint" class="text-caption text-grey-6">{{translatedHint}}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <div v-for="item in previewItems" :key="item.key" class="s-file-preview-item column items-center">
        <div class="s-file-preview-thumb" :style="radiusStyle">
          <img v-if="item.type==='image'" :src="item.src" :alt="item.name">
          <q-icon v-else-if="item.type==='pdf'" name="picture_as_pdf" size="32px"/>
          <q-icon v-else name="insert_drive_file" size="32px"/>
        </div>
        <div class="s-file-preview-name text-caption ellipsis">{{item.name}}</div>
        <div class="row q-gutter-xs">
          <!-- The real <input type="file"> sits transparently on top of
               the visible button inside this wrapper, so the pointer/
               touch event that opens the OS picker lands directly on
               the input itself - not on a JS .click() call, and not on
               a <label for> that merely wraps an interactive <button>
               (per the HTML label activation-behaviour spec, a click on
               a nested labelable/interactive element such as <button>
               is handled by that element and is NOT forwarded to the
               labeled control - only non-interactive label content
               forwards the click; real Chromium/Firefox honour this,
               even though some simplified DOM test environments do
               not). This is the same overlay technique virtually every
               cross-browser custom-file-input implementation uses. -->
          <div v-if="!multiple" class="s-file-picker-btn">
            <s-btn flat round dense size="sm" color="primary" icon="edit">
              <s-tooltip>{{tdc('Change')}}</s-tooltip>
            </s-btn>
            <input :id="inputId" ref="nativeInput" type="file" class="s-file-overlay-input" :accept="accept" :multiple="multiple" @change="onFileChange">
          </div>
          <s-btn flat round dense size="sm" color="negative" icon="delete" @click="removeAt(item.index)">
            <s-tooltip>{{tdc('Remove')}}</s-tooltip>
          </s-btn>
        </div>
      </div>

      <template v-if="multiple||!previewItems.length">
        <div class="s-file-picker-btn">
          <s-btn round outline color="primary" icon="add">
            <s-tooltip>{{tdc('Add')}}</s-tooltip>
          </s-btn>
          <input :id="inputId" ref="nativeInput" type="file" class="s-file-overlay-input" :accept="accept" :multiple="multiple" @change="onFileChange">
        </div>

        <!-- Image field - camera capture is a plain JS-driven dialog
             (never a native OS file picker), so a regular @click is
             fine here; it is a separate action button rather than a
             menu item so it never needs to share the overlay trick
             above with "Choose file". -->
        <s-btn v-if="isImageField" round outline color="primary" icon="photo_camera" @click="cameraOpen=true">
          <s-tooltip>{{tdc('Use camera')}}</s-tooltip>
        </s-btn>
      </template>
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

// Multiple s-file instances can exist on the same page (e.g. a
// repeatable "documents" section, one file input per row) - each gets
// its own id so the two mutually-exclusive <input> branches above never
// collide with another instance's.
let instanceSeq=0

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
    const inputId=`s-file-input-${++instanceSeq}`
    const attrs=useAttrs(),User=useUserStore(),nativeInput=ref(null),localValue=ref(props.modelValue),cameraOpen=ref(false),blobUrls=new Set()
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
      // Cleared even on success (not just on the validation-failure path
      // above) - picking the same file again wouldn't otherwise fire
      // 'change' a second time on the same <input>.
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

    return{inputId,nativeInput,localValue,cameraOpen,accept,translatedLabel,translatedHint,isImageField,hasError,firstError,radiusStyle,previewItems,onFileChange,onCameraCaptured,removeAt,tdc}
  }
})
</script>

<style scoped>
.s-file{position:relative}
.s-file-picker-btn{position:relative;display:inline-flex}
.s-file-overlay-input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;opacity:0;cursor:pointer;font-size:0;z-index:1}
.s-file-preview-thumb{width:64px;height:64px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:rgba(128,128,128,.12)}
.s-file-preview-thumb img{width:100%;height:100%;object-fit:cover}
.s-file-preview-item{width:72px}
.s-file-preview-name{max-width:72px}
.s-file-meta{margin-bottom:4px}
</style>
