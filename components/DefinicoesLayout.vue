<template>

  <q-card>

    <!-- HEADER -->
    <q-bar class="bg-primary text-white">

      <div class="text-h6">🎨 Theme Studio</div>

      <q-space />

      <q-toggle
        v-model="darkMode"
        label="Dark"
        @update:model-value="applyDarkMode"
      />

      <q-btn-toggle
        v-model="previewMode"
        dense
        toggle-color="white"
        :options="[
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' }
        ]"
      />

      <q-btn flat dense icon="save" label="Salvar" @click="saveTheme" />
      <q-btn flat dense icon="close" v-close-popup />

    </q-bar>


    <q-card-section class="q-pa-md">

      <div class="row q-col-gutter-lg">

        <!-- EDITOR -->
        <div class="col-12 col-md-4">

          <q-tabs v-model="tab" dense align="justify">
            <q-tab name="cores" icon="palette" label="Cores" />
            <q-tab name="font" icon="font_download" label="Font" />
            <q-tab name="layout" icon="dashboard_customize" label="Layout" />
            <q-tab name="animation" icon="animation" label="Animation" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>

            <!-- CORES -->
            <q-tab-panel name="cores">

              <q-input
                v-model="search"
                dense
                outlined
                placeholder="Pesquisar cor..."
                class="q-mb-md"
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>

              <div class="row q-col-gutter-sm">

                <div
                  v-for="(value, key) in filteredColors"
                  :key="key"
                  class="col-6"
                >

                  <q-card flat bordered class="cursor-pointer" @click="openColor(key)">

                    <q-card-section class="q-pa-sm">

                      <div class="text-caption">{{ key }}</div>

                      <div
                        class="q-mt-sm"
                        :style="{
                          background: value,
                          height: '40px',
                          borderRadius: '6px'
                        }"
                      />

                      <div class="text-caption q-mt-xs">
                        {{ value }}
                      </div>

                    </q-card-section>

                  </q-card>

                </div>

              </div>

            </q-tab-panel>


            <!-- FONT -->
            <q-tab-panel name="font">

              <q-card bordered>

                <q-card-section class="text-subtitle1">
                  Tipografia
                </q-card-section>

                <q-card-section class="q-gutter-md">

                  <q-select
                    v-model="User.Typography.font_family"
                    :options="fontOptions"
                    label="Font Family"
                    dense
                    outlined
                  />

                  <q-input v-model.number="User.Typography.font_size_base" label="Font Base" type="number" dense outlined/>
                  <q-input v-model.number="User.Typography.font_size_h1" label="H1" type="number" dense outlined/>
                  <q-input v-model.number="User.Typography.font_size_h2" label="H2" type="number" dense outlined/>
                  <q-input v-model.number="User.Typography.font_size_h3" label="H3" type="number" dense outlined/>

                  <q-input v-model.number="User.Typography.font_weight_normal" label="Peso normal" type="number" dense outlined/>
                  <q-input v-model.number="User.Typography.font_weight_bold" label="Peso bold" type="number" dense outlined/>

                  <q-input v-model.number="User.Typography.line_height" label="Line height" type="number" step="0.1" dense outlined/>

                </q-card-section>

              </q-card>

            </q-tab-panel>


            <!-- LAYOUT -->
            <q-tab-panel name="layout">

              <!-- BOTÕES -->
              <q-card bordered class="q-mb-md">

                <q-card-section class="text-subtitle1">
                  Botões
                </q-card-section>

                <q-card-section class="q-gutter-md">

                  <q-select
                    v-model="User.LayoutSettings.button.style"
                    :options="buttonStyleOptions"
                    label="Estilo"
                    dense
                    outlined
                  />

                  <q-toggle v-model="User.LayoutSettings.button.dense" label="Dense" />
                  <q-toggle v-model="User.LayoutSettings.button.round" label="Round" />

                </q-card-section>

              </q-card>


              <!-- INPUT -->
              <q-card bordered class="q-mb-md">

                <q-card-section class="text-subtitle1">
                  Inputs
                </q-card-section>

                <q-card-section class="q-gutter-md">

                  <q-select
                    v-model="User.LayoutSettings.input.style"
                    :options="inputStyleOptions"
                    label="Estilo"
                    dense
                    outlined
                  />

                  <q-toggle v-model="User.LayoutSettings.input.dense" label="Dense" />

                </q-card-section>

              </q-card>


              <!-- SIDEBAR -->
              <q-card bordered>

                <q-card-section class="text-subtitle1">
                  Sidebar
                </q-card-section>

                <q-card-section class="q-gutter-md">

                  <q-toggle v-model="User.LayoutSettings.sidebar.mini" label="Mini sidebar" />

                  <q-input
                    v-model.number="User.LayoutSettings.sidebar.width"
                    label="Sidebar width"
                    type="number"
                    outlined
                    dense
                  />

                </q-card-section>

              </q-card>

            </q-tab-panel>


            <!-- ANIMATION -->
            <q-tab-panel name="animation">

              <q-card bordered>

                <q-card-section class="text-subtitle1">
                  Animation
                </q-card-section>

                <q-card-section class="q-gutter-md">

                  <q-toggle
                    v-model="User.AnimationSetting.enable_animations"
                    label="Enable animations"
                  />

                  <q-select
                    v-model="User.AnimationSetting.animation_speed"
                    :options="['slow','normal','fast']"
                    label="Animation speed"
                    dense
                    outlined
                  />

                  <q-select
                    v-model="User.AnimationSetting.page_transition"
                    :options="['fade','slide-left','slide-right','scale']"
                    label="Page transition"
                    dense
                    outlined
                  />

                  <q-select
                    v-model="User.AnimationSetting.button_animation"
                    :options="['none','ripple','pulse']"
                    label="Button animation"
                    dense
                    outlined
                  />

                </q-card-section>

              </q-card>

            </q-tab-panel>

          </q-tab-panels>

        </div>


        <!-- PREVIEW -->
        <div class="col-12 col-md-8">

          <div :class="previewMode === 'mobile' ? 'mobile-frame' : ''">

            <q-layout view="hHh lpR fFf" container style="height:700px">

              <q-header bordered class="bg-primary text-white">

                <q-toolbar :dense="User.LayoutSettings.toolbar?.dense">

                  <q-btn flat dense round icon="menu" />

                  <q-toolbar-title>
                    Preview
                  </q-toolbar-title>

                </q-toolbar>

              </q-header>


              <q-drawer
                show-if-above
                bordered
                :mini="User.LayoutSettings.sidebar.mini"
                :width="User.LayoutSettings.sidebar.width"
              >

                <q-list>

                  <q-item clickable>

                    <q-item-section avatar>
                      <q-icon name="home" />
                    </q-item-section>

                    <q-item-section>Dashboard</q-item-section>

                  </q-item>

                </q-list>

              </q-drawer>


              <q-page-container>

                <q-page class="q-pa-md">

                  <q-card class="q-mb-md">

                    <q-card-section class="bg-secondary text-white">
                      Card Preview
                    </q-card-section>

                    <q-card-section>

                      <q-input
                        label="Nome"
                        v-model="previewForm.name"
                        :dense="User.LayoutSettings.input.dense"
                        :outlined="User.LayoutSettings.input.style === 'outlined'"
                        :filled="User.LayoutSettings.input.style === 'filled'"
                      />

                      <div class="q-mt-md">

                        <q-btn
                          color="primary"
                          label="Primário"
                          :flat="User.LayoutSettings.button.style === 'flat'"
                          :outline="User.LayoutSettings.button.style === 'outline'"
                          :unelevated="User.LayoutSettings.button.style === 'unelevated'"
                          :dense="User.LayoutSettings.button.dense"
                          :round="User.LayoutSettings.button.round"
                        />

                      </div>

                    </q-card-section>

                  </q-card>

                </q-page>

              </q-page-container>

            </q-layout>

          </div>

        </div>

      </div>

    </q-card-section>

  </q-card>


  <!-- COLOR MODAL -->
  <q-dialog v-model="colorDialog">

    <q-card style="min-width:350px">

      <q-card-section>
        Alterar cor: {{ selectedKey }}
      </q-card-section>

      <q-card-section>

        <q-color
          v-model="tempColor"
          format-model="hex"
          @update:model-value="previewColor"
        />

      </q-card-section>

      <q-card-actions align="right">

        <q-btn flat label="Cancelar" v-close-popup />

        <q-btn color="primary" label="Aplicar" @click="applyColor" />

      </q-card-actions>

    </q-card>

  </q-dialog>

</template>


<script>
import { defineComponent } from "vue"
import { Dark, setCssVar } from "quasar"
import { HTTPAuth, url } from "../boot/api"
import { UserStore } from "../stores/AuthStore"

export default defineComponent({

  setup(){
    const User = UserStore()
    return { User }
  },

  data(){
    return{
      tab:"cores",
      search:"",
      colorDialog:false,
      selectedKey:null,
      tempColor:"#1976D2",
      previewMode:"desktop",
      darkMode:false,

      previewForm:{name:""},

      fontOptions:[
        "Roboto","Inter","Open Sans","Lato","Poppins",
        "Montserrat","Nunito","Source Sans Pro"
      ],

      buttonStyleOptions:["flat","outline","unelevated","push"],
      inputStyleOptions:["outlined","filled","standout"]
    }
  },

  computed:{

    filteredColors(){

      const result={}

      Object.entries(this.User.Theme||{}).forEach(([key,value])=>{
        if(key.toLowerCase().includes(this.search.toLowerCase())){
          result[key]=value
        }
      })

      return result
    }

  },

  mounted(){

    Object.entries(this.User.Theme||{}).forEach(([k,v])=>{
      if(typeof v==="string"){
        setCssVar(k,v)
      }
    })

    this.darkMode=this.$q.dark.isActive
  },

  methods:{

    openColor(key){
      this.selectedKey=key
      this.tempColor=this.User.Theme[key]
      this.colorDialog=true
    },

    previewColor(color){
      setCssVar(this.selectedKey,color)
    },

    applyColor(){
      this.User.Theme[this.selectedKey]=this.tempColor
      setCssVar(this.selectedKey,this.tempColor)
      this.colorDialog=false
    },

    applyDarkMode(val){
      Dark.set(val)
    },

    async saveTheme(){

      await HTTPAuth.put(url({
        type:"u",
        url:`/api/django_resaas/entidades/${this.User.Entidade.id}/themePut/`
      }),this.User.Theme)

      await HTTPAuth.put(url({
        type:"u",
        url:`/api/django_resaas/entidades/${this.User.Entidade.id}/layoutSettingsPut/`
      }),this.User.LayoutSettings)

      await HTTPAuth.put(url({
        type:"u",
        url:`/api/django_resaas/entidades/${this.User.Entidade.id}/typographyPut/`
      }),this.User.Typography)

      await HTTPAuth.put(url({
        type:"u",
        url:`/api/django_resaas/entidades/${this.User.Entidade.id}/animationSettingsPut/`
      }),this.User.AnimationSetting)

    }

  }

})
</script>


<style scoped>

.mobile-frame{
  max-width:390px;
  margin:auto;
}

</style>