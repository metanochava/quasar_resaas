<template>
  <q-page class=" q-pa-sm">

    <q-dialog v-model="model_action" persistent full-width full-height>
      <ModelAction :modulo="form.modulo" :modelo="form.modelo"  :accao="accao" />
    </q-dialog>

    <!-- HEADER -->
    
    <div class="row">
      <s-card flat bordered class="col">

        <q-card-section class="text-subtitle1" dense>
          <div class="row items-center  sticky-header">
            <div class="text-h5"> ⚡ Scaffold Command Wizard</div>
            <q-space/>
            <s-btn flat icon="visibility" label="Preview" @click="generatePreview" />
            <s-btn color="primary" icon="save" label="Create / Update" @click="submit" />
          </div>
        </q-card-section>

        <q-separator/>

        <q-card-section>

          <div class="row  q-col-gutter-md ">
            <div class="col">
              <s-select
                v-model="form.modulo"
                :options="modules"
                label="Module"
                outlined
                dense 
                map-options
                emit-value
                option-value="name"
                option-label="name"
                @update:model-value="loadModelsSchema(form.modulo)"
              />
            </div>

            <div class="col">
              <s-input dense
                v-model="form.modelo"
                label="Model Name"
                outlined

                @keyup="accaoTeste = false"
              />
            </div>

             <div class="col">
              <s-switch
                v-model="form.crud"
                label="Crudeble"
                dense
                outlined
              >
              </s-switch>
            </div>

            <div class="col">
              <s-select
                v-model="form.icon"
                :options="ICONS"
                label="Icon"
                use-input
                dense
                outlined
              >

                <!-- ITEM SELECIONADO -->
                <template v-slot:selected-item="scope">
                  <div class="row items-center q-gutter-sm">
                    <q-icon :name="scope.opt" />
                    <span>{{ scope.opt }}</span>
                  </div>
                </template>

                <!-- LISTA DE OPÇÕES -->
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt" />
                    </q-item-section>

                    <q-item-section>
                      {{ scope.opt }}
                    </q-item-section>
                  </q-item>
                </template>

              </s-select>
            </div>

           



            <div class="col" v-if="models.includes(form.modelo)">
              <s-btn class="full-width" color="primary" icon="refresh"  label="Reload Model" @click="reloadModelShema" />
            </div>
          </div>
        </q-card-section>
      </s-card>
    </div>
    <div class="row q-col-gutter-md">

      <!-- ================= LEFT (COMMAND STYLE FORM) ================= -->
      <div class="col-4">
        <!-- ================= FIELDS ================= -->
        <s-card flat bordered class=" q-mt-md" dense>

          <q-card-section class="row items-center" dense>
            <div class="text-subtitle1" dense>📋 Fields</div>
            <q-space/>
            <s-btn dense icon="add" @click="addField" />
          </q-card-section>

          <q-separator/>

          <q-list bordered dense >
            <q-expansion-item
              dense
              v-for="(f, i) in form.fields"
              :key="i"
              :label="f.name || 'new_field'"
              group="fields"
              :model-value="i === form.fields.length - 1"
              expand-separator
            
            >


              <div class="q-pa-sm  q-gutter-sm">

                <div class="row q-gutter-sm q-col-gutter-sm">
                  <div class="col">
                    <s-input dense v-model="f.name" label="name" outlined />
                  </div>
                  <div class="col-7">
                    <s-select
                      dense
                      v-model="f.type"
                      :options="filteredTypes"
                      label="type"
                      outlined
                      use-input
                      @filter="filterTypes"
                    >
                      <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                        {{st('Sem resultados')}}
                        </q-item-section>
                      </q-item>
                      </template>
                    </s-select>

                  </div> 
                </div>

                <div class="row q-gutter-sm q-col-gutter-sm">
                  <div class="col">
                    <s-input dense v-model="f.verbose_name" label="Verbose name" outlined />
                  </div>

                  <div class="col-7 q-pr-sm">
                    <s-input dense v-model="f.help_text" label="Help text" outlined />
                  </div>
                </div>

                <div class="row q-gutter-sm  q-mt-md">
                  <div class="col">
                    <s-switch v-model="f.required" label="required" />
                  </div>
                  <div class="col">
                    <s-switch v-model="f.unique" label="unique" />
                  </div>
                  <div class="col" v-if="!(['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type))">
                    <s-input dense v-model="f.default" label="default" outlined />
                  </div>
                </div>

                <div  v-if="isChar(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <s-input dense v-model="f.min_length" type="number" label="min length" outlined/>
                  </div>
                  <div class="col">
                    <s-input  dense v-model="f.max_length" type="number" label="max length" outlined/>
                  </div>
                </div>


                <div  v-if="isDecimalOrMoney(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <s-input dense v-model="f.max_digits" type="number" label="max digits" outlined/>
                  </div>
                  <div class="col">
                    <s-input  dense v-model="f.decimal_places" type="number" label="decimal places" outlined/>
                  </div>
                  <div class="col">
                    <s-select
                      dense
                      v-model="f.default_currency"
                      :options="filteredMoneys"
                      label="type"
                      outlined
                      use-input
                      @filter="filterMoneys"
                    >
                      <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                        {{st('Sem resultados')}}
                        </q-item-section>
                      </q-item>
                      </template>
                    </s-select>
                  </div>
                </div>

                <div  v-if="isInteger(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <s-input dense v-model="f.min" type="number" label="min" outlined/>
                  </div>
                  <div class="col">
                    <s-input  dense v-model="f.max" type="number" label="max" outlined/>
                  </div>
                </div>

                <div  v-if="isFile(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <s-input dense v-model="f.width_field" type="number" label="width_field" outlined/>
                  </div>
                  <div class="col">
                    <s-input  dense v-model="f.height_field" type="number" label="height_field" outlined/>
                  </div>
                </div>

                <div  v-if="isDate(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <s-switch dense v-model="f.auto_now_add"  label="Auto Now Add" outlined/>
                  </div>
                  <div class="col">
                    <s-switch  dense v-model="f.auto_now"  label="Auto Now" outlined/>
                  </div>
                </div>
                
              
                <s-card flat bordered class=" q-mt-md"  v-if="!(['ForeignKey','OneToOneField','ManyToManyField','FileField', 'ImageField', 'TextField'].includes(f.type))" >
                  <q-card-section>
                    ♋️ Choices
                    <div class="row q-col-gutter-sm q-pa-0">
                      <div class="col">
                        <s-input
                          v-model="newChoice.key"
                          label="Key"
                          outlined
                          dense
                          @keyup.enter="addChoice(f)"
                        />
                      </div>

                      <div class="col">
                        <s-input
                          v-model="newChoice.label"
                          label="Label"
                          outlined
                          dense
                          @keyup.enter="addChoice(f)"
                        />
                      </div>
                    </div>

                    <div v-if="f?.choices?.length === 0" class="text-grey">
                      Nenhum choice adicionado
                    </div>

                    <q-list bordered v-else>
                      <q-item
                        v-for="(choice, index) in f?.choices"
                        :key="index"
                      >
                        <q-item-section>
                          <q-item-label>
                            Key:{{ choice?.key }}
                          </q-item-label>
                          <q-item-label caption>
                            Label: {{ choice?.label }}
                          </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <s-btn
                            icon="delete"
                            color="negative"
                            flat
                            dense
                            round
                            @click="removeChoice(f, index)"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </s-card>
                
                <!-- RELATION -->
                <div v-if="isRelation(f)">

                  <div class="row q-col-gutter-sm q-pa-0">
                    <div class="col">
                      <s-select
                        v-model="f.relModule"
                        :options="modules"
                        label="module"
                        outlined
                        dense 
                        map-options
                        emit-value
                        option-value="name"
                        option-label="name"
                        @update:model-value="loadModelsRelation(f)"
                      />
                    </div>

                    <div class="col">
                      <s-select
                        v-model="f.relation"
                        :options="f?.models"
                        label="model"
                        outlined
                        dense 
                      />
                    </div>

                    <div class="col" v-if="f.type !== 'ManyToManyField'">
                      <s-select
                        v-model="f.on_delete"
                        :options="onDeletes"
                        label="on_delete"
                        dense
                        outlined
                      />
                    </div>
                  </div>
                </div>
                
                <s-btn flat color="negative" label="remove" @click="removeField(i)" dense/>

              </div>

            </q-expansion-item>

          </q-list>
        </s-card>

        <!-- ================= actions ================= -->
        <s-card flat bordered class="q-mt-md" v-if="accaoTeste">
          <q-card-section class="row q-col-gutter-sm q-gutter-s">
            <div class="text-h6 text-grey col-12">🔐 Extra actions of {{ form.modulo }}.{{form.modelo}}</div>
            <div class="col-12">
              <s-select
                v-model="accao.Icon"
                :options="ICONS"
                label="Icon"
                use-input
                dense
                outlined
              >

                <!-- ITEM SELECIONADO -->
                <template v-slot:selected-item="scope">
                  <div class="row items-center q-gutter-sm">
                    <q-icon :name="scope.opt" />
                    <span>{{ scope.opt }}</span>
                  </div>
                </template>

                <!-- LISTA DE OPÇÕES -->
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt" />
                    </q-item-section>

                    <q-item-section>
                      {{ scope.opt }}
                    </q-item-section>
                  </q-item>
                </template>

              </s-select>
            </div>

            <s-select
              class="col"
              v-model="accao.Method"
              :options="['get', 'post', 'put', 'delete']"
              label="method"
              outlined
              dense 
            />
            <s-switch
              class="col"
              v-model="accao.Details"
              label="Details"
              outlined
              dense 
            />
            <s-input class="col" dense v-model="accao.Permission" @keyup.enter="addPerm()" outlined label="Permission" placeholder="Permission"/>
            <s-input class="col-12" dense v-model="accao.Url" @keyup.enter="addPerm()" placeholder="'(?P<model>[^/.]+)/schema'" outlined/>

            <s-btn v-if="form.modelo" class=" col-12" flat icon="arrow_upward" color="success" :label="'Permissions Updade' + ' '+ form.modelo" @click="permissionUpdade" />

            <q-chip
              @dblclick="accaoMetodo(p)"
              :icon="p.icon"
              :class="{
                'bg-green text-white': p.method === 'get',
                'bg-blue text-white': p.method === 'post',
                'bg-orange text-white': p.method ==='put',
                'bg-red text-white': p.method === 'delete'
              }"
              v-for="(p,i) in form?.actions"
              :key="i"
              removable
              @remove="form?.actions.splice(i,1)"
            >
              {{ p.method + '_' +p.permission }}
              <q-tooltip class="bg-primary text-white">
                url = {{p.url}}<br />
                details = {{p.details}}
              </q-tooltip>
            </q-chip>
            
          </q-card-section>
          
        </s-card>

      </div>

      <!-- ================= RIGHT (PREVIEW CODE) ================= -->
      
      <div class="col-8">
        <div class="row" >
          <s-btn v-if="form.modulo" class=" col" flat icon="refresh" color="accent" :label="'Migrate' + ' '+ form.modulo" @click="generateMigrate" />
        </div>
        <div class="col" v-if="out">
          <br>
          <pre  class="code">{{ out }}</pre>
        </div>

        <q-tabs v-model="tab" dense  v-if="!out" >

          <q-tab name="model" label="Model"/>
          <q-tab name="serializer" label="Serializer"/>
          <q-tab name="view" label="View"/>

        </q-tabs>

        <q-separator  v-if="!out"/>

        <q-tab-panels  v-if="!out" v-model="tab" animated>

          <q-tab-panel name="model">
            <pre class="code">{{ preview?.model }}</pre>
          </q-tab-panel>

          <q-tab-panel name="serializer">
            <pre class="code">{{ preview?.serializer }}</pre>
          </q-tab-panel>

          <q-tab-panel name="view">
            <pre class="code">{{ preview?.view }}</pre>
          </q-tab-panel>

        </q-tab-panels>
      </div>
    </div>
  </q-page>
</template>

<script>

import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc, useUserStore , AlertError, buildFormFromSchema } from './../../index'
import ModelAction from './ModelAction.vue';


export default {

  name: 'ScaffoldCommandWizard',

  components:{
    ModelAction
  },

  setup () {
    const User = useUserStore()
    return {
      User
    }
  },

  data () {
    return {

      tab: 'model',
      model_action: false,
      out: null,

      accaoTeste: false,

      accao:{
        Permission: '',
        Icon: 'list',
        Method: 'get',
        Details: true,
        Url: '',
      },



      newChoice :{
        label: '',
        key: ''
      },

      modules: [],
      icons: [],
      models: [],
      filteredTypes: [],
      filteredMoneys: [],
      rawMoneys : [
        'MZN',
        'USD',
        '...',
      ],

      ICONS: [
        "menu",
        "add","add_circle","add_box","add_link",
        "edit","edit_note","edit_square",
        "delete","delete_forever","delete_outline",
        "visibility","visibility_off",
        "search","filter_alt","filter_list",
        "download","upload","file_upload","file_download",
        "save","save_alt",
        "refresh","restart_alt","autorenew",
        "home","dashboard","space_dashboard",
        "settings","settings_applications","tune",
        "person","group","groups","badge",
        "account_circle","supervisor_account",
        "lock","lock_open","vpn_key",
        "email","mail","mark_email_read",
        "phone","call","contacts",
        "calendar_today","event","schedule",
        "image","photo","photo_camera",
        "folder","folder_open","drive_folder_upload",
        "attach_file","attachment",
        "list","view_list","table_view","dataset",
        "inventory","inventory_2","storage",
        "widgets","apps","extension",
        "construction","build","engineering","architecture",
        "shopping_cart","payments","credit_card",
        "receipt","point_of_sale","request_quote",
        "bar_chart","pie_chart","analytics","timeline",
        "trending_up","trending_down",
        "print","picture_as_pdf","description",
        "article","note","notes",
        "map","location_on","place",
        "public","language",
        "notifications","notifications_active",
        "help","help_outline","info","info_outline",
        "warning","error","check","check_circle",
        "cancel","close","done","done_all",
        "arrow_back","arrow_forward","arrow_upward","arrow_downward",
        "expand_more","expand_less",
        "chevron_left","chevron_right",
        "fullscreen","fullscreen_exit",
        "zoom_in","zoom_out",
        "play_arrow","pause","stop",
        "mic","mic_off","volume_up","volume_off",
        "favorite","favorite_border","star","star_border",
        "share","link","content_copy",
        "cloud","cloud_upload","cloud_download",
        "wifi","bluetooth","battery_full",
        "desktop_windows","laptop","phone_android",
        "security","verified","shield",
        "bug_report","report","report_problem",
        "code","terminal","data_object",
        "api","integration_instructions"
      ],


      rawTypes : [

        //  # TEXT
        'CharField',
        'TextField',
        'EmailField',
        'SlugField',
        'URLField',
        'UUIDField',

        //  # NUMBERS
        'IntegerField',
        'BigIntegerField',
        'SmallIntegerField',
        'PositiveIntegerField',
        'PositiveBigIntegerField',
        'FloatField',
        'DecimalField',

        //  # BOOLEAN
        'BooleanField',

        //  # DATE
        'DateField',
        'DateTimeField',
        'TimeField',
        'DurationField',

        //  # FILES
        'FileField',
        'ImageField',

        //  # DATA
        'JSONField',
        'BinaryField',

        //  # RELATIONS
        'ForeignKey',
        'OneToOneField',
        'ManyToManyField',

        //  # MONEY
        'MoneyField',

      ],


      onDeletes: ['CASCADE','PROTECT','SET_NULL','SET_DEFAULT','DO_NOTHING','RESTRICT'],

      form: {
        modulo: '',
        modelo: '',
        icon: 'list',
        crud: false,
        fields: [],
        actions: []
      },

      preview: {
        model: '',
        serializer: '',
        view: '',
      }

    }
  },

  mounted(){
    this.loadApps()
    this.filteredTypes = this.rawTypes
    this.filteredMoneys = this.rawMoneys
  },


  methods: {

     filterTypes (val, update) {
      if (val === '') {
        update(() => {
          this.filteredTypes = this.rawTypes
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredTypes = this.rawTypes
          .filter((v) => v.toLowerCase().indexOf(needle) > -1)
      })
    },

    filterMoneys (val, update) {
      if (val === '') {
        update(() => {
          this.filteredMoneys = this.rawMoneys
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredMoneys = this.rawMoneys
          .filter((v) => v.toLowerCase().indexOf(needle) > -1)
      })
    },


    addField () {
      this.form.fields.push({
        name: '',
        type: '',
        required: true, 
        help_text: '',
        unique: false, 
        choices: [],
      })
    },

    removeField (i) {
      this.form.fields.splice(i,1)
    },

    addChoice(f){
      if (!Array.isArray(f.choices)) {
        f.choices = []
      }

      if (this.newChoice.key!== '' && this.newChoice.label !== '' ){
        f.choices.push({ ...this.newChoice })
        this.newChoice.label = ''
        this.newChoice.key = ''
      }else{
        AlertError('Label, Key ou ambos estao vazios!')
      }
    },

    removeChoice (f, index){
      f.choices.splice(index, 1)
    },

    addPerm () {
      if (!this.accao.Permission) return
      if (!this.accao.Method) return
      this.form.actions.push({'icon' :this.accao.Icon, 'method' :this.accao.Method, 'permission': this.accao.Permission.toLowerCase(),  'url' : this.accao.Url, 'details' : this.accao.Details})
      this.accao.Permission=''
      this.accao.Icon='list'
      this.accao.Method=''
      this.accao.Url=''
      this.accao.Details=true
    },

    accaoMetodo (p) {
      this.model_action = true
      this.accao = p
    },

    isRelation (f) {
      return ['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type)
    },

    isFile (f) {
      return ['FileField','ImageField'].includes(f.type)
    },

    isDate (f) {
      return ['DateField', 'DuractionField','DateTimeField'].includes(f.type)
    },

    isChar (f) {
      return f.type === 'CharField'
    },

    isInteger (f) {
      return f.type === 'IntegerField'
    },

    isDecimalOrMoney (f) {
      return ['MoneyField', 'DecimalField'].includes(f.type)
    },

    normalizeFields(fields) {
      return fields.map(f => {
        const field = {
          name: f.name,
          type: f.type,
          verbose_name: f.verbose_name,
          help_text: f.help_text,
          null: f.null,
          blank: f.blank,
          default: f.default,
          choices: f.choices,
          on_delete: f.on_delete,
          min: f.min,
          max: f.max,
          min_length: f.min_length,
          max_length: f.max_length,
          max_digits: f.max_digits,
          decimal_places: f.decimal_places,
          default_currency: f.default_currency,
          auto_now_add: f.auto_now_add,
          auto_now: f.auto_now,
          width_field: f.width_field,
          height_field: f.height_field,
        }

        // RELAÇÃO
        if (f.relModule && f.relation) {
          field.relation = `${f.relModule}.${f.relation}`
        }

        return field
      })
    },


    async generatePreview () {
      this.out=null
      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields),
        actions: this.form.actions,
      }
      const { data } = await HTTPAuth.post('api/django_resaas/scaffolds/preview/', payload)

      this.preview = data.data || data || {
        model:'',
        serializer:'',
        view:'',
      }
    },

    async generateMigrate () {
      this.out=null
      const payload = {
        modulo: this.form.modulo,
      }
      const { data } = await HTTPAuth.post('api/django_resaas/scaffolds/migrate/', payload)
      this.out = data.out 
    },

    async permissionUpdade () {
      this.out=null
      const payload = {
        modulo: this.form.modulo,
        modelo: this.form.modelo,
        actions: this.form.actions,
      }
      const { data } = await HTTPAuth.post('api/django_resaas/scaffolds/permissions/', payload)
      this.out = data.out 
    },

    async reloadModelShema(){
      this.accaoTeste = false
      const data = await buildFormFromSchema({'module': this.form.modulo, 'model': this.form.modelo})
      this.form.fields = data.schema
      this.form.fields = (this.form.fields || []).filter(f =>
        !['id', 'created_at', 'is_deleted', 'updated_at', 'estado', 'created_by', 'updated_by', 'deleted_at', 'entidade', 'sucursal'].includes(f?.name)
      )
      this.form.actions =data.actions
      this.accaoTeste = true
    },

    async submit () {
      this.out = 'response...'
      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields)
      }
      const {data} = await HTTPAuth.post('api/django_resaas/scaffolds/', payload)
      this.out = data.out
    },

    async loadApps() {
      const {data} = await HTTPAuth.get('api/django_resaas/resaas_modulos/')
      this.modules = data.apps
    },

    async loadModelsRelation(f){
      const {data} = await HTTPAuth.get('api/django_resaas/resaas_modulos/'+ f.relModule)
      f.models = data.models
    },

    async loadModelsSchema(f){
      const {data} = await HTTPAuth.get('api/django_resaas/resaas_modulos/'+ f)
      this.models = data.models
      this.accaoTeste = false
    },
  }
}
</script>



<style scoped>
.code{
  padding:16px;
  border-radius:8px;
  font-size:12px;
  overflow:auto;
}
.sticky-header{
  position:sticky;
  top:0;
  z-index:5;
  /* background:#121212; */
} 
</style>



