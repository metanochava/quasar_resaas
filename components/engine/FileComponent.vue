<template>
  <div class="s-file">
    <div v-if="hasError||translatedHint" class="s-file-meta">
      <div v-if="hasError" class="text-negative text-caption">{{firstError}}</div>
      <div v-else-if="translatedHint" class="text-caption text-grey-6">{{translatedHint}}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <div v-for="item in previewItems" :key="item.key" class="s-file-preview-item">
        <div class="s-file-preview-thumb" :style="radiusStyle">
          <q-img v-if="item.type==='image'" :src="item.src" :alt="item.name" class="full-width full-height"/>

          <object
            v-else-if="item.type==='pdf'"
            :data="`${item.src}#page=1&toolbar=0&navpanes=0&scrollbar=0`"
            type="application/pdf"
            class="s-file-pdf"
            tabindex="-1"
          >
            <div class="s-file-document">
              <q-icon name="picture_as_pdf" size="40px" color="negative"/>
              <span>PDF</span>
            </div>
          </object>

          <div v-else class="s-file-document">
            <q-icon name="insert_drive_file" size="40px" color="grey-7"/>
            <span>{{item.extension||tdc("File")}}</span>
          </div>

          <div class="s-file-preview-actions">
            <div v-if="!multiple" class="s-file-action-picker">
              <s-btn flat round dense size="sm" color="white" icon="edit" class="s-file-action">
                <s-tooltip>{{tdc("Change")}}</s-tooltip>
              </s-btn>
              <input
                :id="inputId"
                ref="nativeInput"
                type="file"
                class="s-file-overlay-input"
                :accept="accept"
                :multiple="multiple"
                @change="onFileChange"
              >
            </div>

            <s-btn
              flat
              round
              dense
              size="sm"
              color="white"
              icon="delete"
              class="s-file-action"
              @click="removeAt(item.index)"
            >
              <s-tooltip>{{tdc("Remove")}}</s-tooltip>
            </s-btn>
          </div>

          <s-tooltip v-if="translatedLabel" class="s-file-tooltip">
            {{translatedLabel}}{{required?" *":""}}
          </s-tooltip>
        </div>

        <div v-if="item.name" class="s-file-preview-name ellipsis">
          {{item.name}}
          <s-tooltip>{{item.name}}</s-tooltip>
        </div>
      </div>

      <template v-if="multiple||!previewItems.length">
        <div class="s-file-add" :style="radiusStyle">
          <div class="s-file-picker-btn">
            <s-btn flat round color="primary" icon="add" size="lg">
              <s-tooltip class="s-file-tooltip">
                {{translatedLabel||tdc("Add")}}{{required?" *":""}}
              </s-tooltip>
            </s-btn>

            <input
              :id="inputId"
              ref="nativeInput"
              type="file"
              class="s-file-overlay-input"
              :accept="accept"
              :multiple="multiple"
              @change="onFileChange"
            >
          </div>

          <s-btn
            v-if="isImageField"
            flat
            round
            color="primary"
            icon="photo_camera"
            @click="cameraOpen=true"
          >
            <s-tooltip>{{tdc("Use camera")}}</s-tooltip>
          </s-btn>

          <s-tooltip v-if="translatedLabel" class="s-file-tooltip">
            {{translatedLabel}}{{required?" *":""}}
          </s-tooltip>
        </div>
      </template>
    </div>

    <CameraCaptureDialog
      v-if="isImageField"
      v-model="cameraOpen"
      @captured="onCameraCaptured"
    />
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

    const translatedLabel=computed(()=>{
      const value=props.label||attrs.label||attrs.name||""
      return value?tdc(value):""
    })

    const translatedHint=computed(()=>{
      const value=props.hint||attrs.hint||""
      return value?tdc(value):""
    })

    const isImageField=computed(()=>looksLikeImageAccept(accept.value))
    const hasError=computed(()=>!!props.error)
    const firstError=computed(()=>(typeof props.error==="string"&&props.error)||props.errorMessage||"")
    const radiusStyle=computed(()=>({borderRadius:layout.value.rounded?"16px":"6px"}))

    watch(()=>props.modelValue,v=>localValue.value=v)
    watch(localValue,v=>emit("update:modelValue",v))

    const previewItems=computed(()=>{
      const values=Array.isArray(localValue.value)?localValue.value:(localValue.value?[localValue.value]:[])
      return values.map((value,index)=>{
        const preview=resolvePreview(value)
        if(!preview)return null
        if(preview.isBlobUrl)blobUrls.add(preview.src)
        const name=preview.name||value?.name||""
        const extension=name.includes(".")?name.split(".").pop().toUpperCase():""
        return{
          ...preview,
          name,
          extension,
          index,
          key:value instanceof File?`${value.name}-${value.size}-${value.lastModified}`:(value?.url||index)
        }
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

      event.target.value=""
    }

    function onCameraCaptured(file){
      if(!file||validateFile(file)!==true)return

      if(props.multiple){
        const current=Array.isArray(localValue.value)?localValue.value:(localValue.value?[localValue.value]:[])
        localValue.value=[...current,file]
      }else localValue.value=file
    }

    function removeAt(index){
      if(Array.isArray(localValue.value))localValue.value=localValue.value.filter((_,i)=>i!==index)
      else localValue.value=null

      const inputs=Array.isArray(nativeInput.value)?nativeInput.value:[nativeInput.value]
      inputs.filter(Boolean).forEach(input=>input.value="")
    }

    onBeforeUnmount(()=>blobUrls.forEach(url=>URL.revokeObjectURL(url)))

    return{
      inputId,nativeInput,cameraOpen,accept,translatedLabel,translatedHint,
      required:props.required,isImageField,hasError,firstError,radiusStyle,
      previewItems,onFileChange,onCameraCaptured,removeAt,tdc
    }
  }
})
</script>

<style scoped>
.s-file{position:relative;width:100%}
.s-file-meta{margin-bottom:6px}
.s-file-preview-item{position:relative;width:110px;min-width:110px}
.s-file-preview-thumb{position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:rgba(128,128,128,.1);border:1px solid rgba(128,128,128,.18);transition:border-color .2s ease}
.s-file-preview-thumb:hover{border-color:var(--q-primary)}
.s-file-preview-thumb :deep(.q-img){width:100%;height:100%}
.s-file-pdf{position:absolute;inset:0;width:100%;height:100%;border:0;overflow:hidden;pointer-events:none;background:white}
.s-file-document{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:11px;color:#777;text-transform:uppercase}
.s-file-preview-actions{position:absolute;top:5px;right:5px;z-index:10;display:flex;gap:2px;padding:2px;border-radius:20px;background:rgba(0,0,0,.52);backdrop-filter:blur(5px)}
.s-file-action-picker,.s-file-picker-btn{position:relative;display:inline-flex}
.s-file-action{min-width:28px;min-height:28px}
.s-file-overlay-input{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;opacity:0;cursor:pointer;font-size:0;z-index:20}
.s-file-preview-name{max-width:110px;margin-top:5px;padding:0 3px;text-align:center;font-size:12px;color:#777}
.s-file-add{position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center;gap:2px;border:1px dashed rgba(128,128,128,.5);background:rgba(128,128,128,.04);transition:border-color .2s ease,background .2s ease}
.s-file-add:hover{border-color:var(--q-primary);background:rgba(128,128,128,.08)}
.s-file-tooltip{font-size:14px}
</style>