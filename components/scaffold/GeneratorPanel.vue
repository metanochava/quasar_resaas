<template>
  <s-modal-card :title="`⚡ ${tdc('Model Generator')}`" icon="build" fullscreen @close="$emit('close')">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <s-select
            v-model="form.app"
            :options="apps"
            :label="tdc('App')"
            map-options
            emit-value
            option-value="name"
            option-label="name"
            @update:model-value="loadModelsSchema(form.app)"
          />
        </div>

        <div class="col-12 col-md-3">
          <s-input
            v-model="form.model"
            :label="tdc('Model name')"
            @keyup="accaoTeste = false"
          />
        </div>

        <div class="col-12 col-md-2">
          <s-switch v-model="form.crud" :label="tdc('Crudable')" />
        </div>

        <div class="col-12 col-md-2">
          <s-select v-model="form.icon" :options="ICONS" :label="tdc('Icon')" use-input>
            <template v-slot:selected-item="scope">
              <div class="row items-center q-gutter-sm">
                <q-icon :name="scope.opt" />
                <span>{{ scope.opt }}</span>
              </div>
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar><q-icon :name="scope.opt" /></q-item-section>
                <q-item-section>{{ scope.opt }}</q-item-section>
              </q-item>
            </template>
          </s-select>
        </div>

        <div class="col-12 col-md-2" v-if="models.includes(form.model)">
          <s-btn class="full-width" color="secondary" icon="refresh" :label="tdc('Reload Model')" @click="reloadModelShema" />
        </div>
      </div>
      <div class="row q-col-gutter-md">

        <!-- ================= FIELDS ================= -->
        <div class="col-12 col-md-4">
          <FormSection title="Fields" icon="view_column">
            <div class="col-12 row items-center justify-between">
              <div />
              <s-btn dense flat icon="add" :label="tdc('Add field')" @click="addField" />
            </div>

            <div class="col-12">
              <q-list bordered dense>
                <q-expansion-item
                  dense
                  v-for="(f, i) in form.fields"
                  :key="i"
                  :label="f.name || 'new_field'"
                  group="fields"
                  :model-value="i === form.fields.length - 1"
                  expand-separator
                >
                  <div class="q-pa-sm q-gutter-sm">
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-5">
                        <s-input v-model="f.name" :label="tdc('name')" />
                      </div>
                      <div class="col-12 col-sm-7">
                        <s-select
                          v-model="f.type" :options="filteredTypes" :label="tdc('type')"
                          use-input @filter="filterTypes"
                        />
                      </div>
                    </div>

                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-6">
                        <s-input v-model="f.verbose_name" :label="tdc('Verbose name')" />
                      </div>
                      <div class="col-12 col-sm-6">
                        <s-input v-model="f.help_text" :label="tdc('Help text')" />
                      </div>
                    </div>

                    <div class="row q-col-gutter-sm items-center">
                      <div class="col-4"><s-switch v-model="f.required" :label="tdc('required')" /></div>
                      <div class="col-4"><s-switch v-model="f.unique" :label="tdc('unique')" /></div>
                      <div class="col-4" v-if="!(['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type))">
                        <s-input v-model="f.default" :label="tdc('default')" />
                      </div>
                    </div>

                    <div v-if="isChar(f)" class="row q-col-gutter-sm">
                      <div class="col-6"><s-input v-model="f.min_length" type="number" :label="tdc('min length')" /></div>
                      <div class="col-6"><s-input v-model="f.max_length" type="number" :label="tdc('max length')" /></div>
                    </div>

                    <div v-if="isDecimalOrMoney(f)" class="row q-col-gutter-sm">
                      <div class="col-4"><s-input v-model="f.max_digits" type="number" :label="tdc('max digits')" /></div>
                      <div class="col-4"><s-input v-model="f.decimal_places" type="number" :label="tdc('decimal places')" /></div>
                      <div class="col-4">
                        <s-select v-model="f.default_currency" :options="filteredMoneys" :label="tdc('currency')" use-input @filter="filterMoneys" />
                      </div>
                    </div>

                    <div v-if="isInteger(f)" class="row q-col-gutter-sm">
                      <div class="col-6"><s-input v-model="f.min" type="number" :label="tdc('min')" /></div>
                      <div class="col-6"><s-input v-model="f.max" type="number" :label="tdc('max')" /></div>
                    </div>

                    <div v-if="isFile(f)" class="row q-col-gutter-sm">
                      <div class="col-6"><s-input v-model="f.width_field" type="number" :label="tdc('width_field')" /></div>
                      <div class="col-6"><s-input v-model="f.height_field" type="number" :label="tdc('height_field')" /></div>
                    </div>

                    <div v-if="isDate(f)" class="row q-col-gutter-sm">
                      <div class="col-6"><s-switch v-model="f.auto_now_add" :label="tdc('Auto Now Add')" /></div>
                      <div class="col-6"><s-switch v-model="f.auto_now" :label="tdc('Auto Now')" /></div>
                    </div>

                    <s-card
                      flat bordered class="q-mt-sm q-pa-sm"
                      v-if="!(['ForeignKey','OneToOneField','ManyToManyField','FileField','ImageField','TextField'].includes(f.type))"
                    >
                      <div class="text-caption text-weight-medium q-mb-xs">{{ tdc('Choices') }}</div>
                      <div class="row q-col-gutter-sm">
                        <div class="col-6"><s-input v-model="newChoice.key" :label="tdc('Key')" @keyup.enter="addChoice(f)" /></div>
                        <div class="col-6"><s-input v-model="newChoice.label" :label="tdc('Label')" @keyup.enter="addChoice(f)" /></div>
                      </div>

                      <div v-if="!f?.choices?.length" class="text-caption text-grey">{{ tdc('No choice added') }}</div>
                      <q-list v-else dense bordered>
                        <q-item v-for="(choice, index) in f?.choices" :key="index">
                          <q-item-section>
                            <q-item-label>{{ choice?.key }}</q-item-label>
                            <q-item-label caption>{{ choice?.label }}</q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <s-btn icon="delete" color="negative" flat dense round @click="removeChoice(f, index)" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </s-card>

                    <div v-if="isRelation(f)" class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-4">
                        <s-select v-model="f.relApp" :options="apps" :label="tdc('app')" map-options emit-value option-value="name" option-label="name" @update:model-value="loadModelsRelation(f)" />
                      </div>
                      <div class="col-12 col-sm-4">
                        <s-select v-model="f.relation" :options="f?.models" :label="tdc('model')" />
                      </div>
                      <div class="col-12 col-sm-4" v-if="f.type !== 'ManyToManyField'">
                        <s-select v-model="f.on_delete" :options="onDeletes" :label="tdc('on_delete')" />
                      </div>
                    </div>

                    <s-btn flat color="negative" dense :label="tdc('remove')" @click="removeField(i)" />
                  </div>
                </q-expansion-item>
              </q-list>
            </div>
          </FormSection>

          <!-- ================= EXTRA ACTIONS (resaas_action) ================= -->
          <FormSection v-if="accaoTeste" title="Extra actions" icon="bolt">
            <div class="col-12 col-sm-6">
              <s-select v-model="accao.method" :options="['get', 'post', 'put', 'delete']" :label="tdc('method')" />
            </div>
            <div class="col-12 col-sm-6">
              <s-input v-model="accao.action" :label="tdc('Action')" />
            </div>
            <div class="col-12 col-sm-6">
              <s-input v-model="accao.label" :label="tdc('Label')" />
            </div>
            <div class="col-12 col-sm-6">
              <s-input v-model="accao.permission" :label="tdc('Permission')" @keyup.enter="addPerm" />
            </div>
            <div class="col-12">
              <s-input v-model="accao.url" :label="tdc('URL path')" @keyup.enter="addPerm" />
            </div>
            <div class="col-12 row q-gutter-sm items-center">
              <s-switch v-model="accao.details" :label="tdc('Details')" />
              <s-switch v-model="accao.visible" :label="tdc('Visible')" />
              <s-switch v-model="accao.autorequest" :label="tdc('Auto request')" />
            </div>
            <div class="col-12">
              <s-btn flat icon="add" :label="tdc('Add action')" @click="addPerm" />
              <s-btn
                v-if="form.model" flat icon="arrow_upward" color="secondary"
                :label="tdc('Update permissions')" @click="permissionUpdade"
              />
            </div>
            <div class="col-12 row q-gutter-xs">
              <q-chip
                v-for="(p, i) in form?.actions" :key="i"
                removable @remove="form?.actions.splice(i, 1)"
              >
                {{ (p.label || p.action || p.permission) + ' [' + p.method + ']' }}
              </q-chip>
            </div>
          </FormSection>
        </div>

        <!-- ================= PREVIEW / DIFF ================= -->
        <div class="col-12 col-md-8">
          <div v-if="applyResult" class="q-mb-sm">
            <s-card flat bordered class="q-pa-sm" :class="applyResult.ok ? 'bg-positive text-white' : 'bg-negative text-white'">
              {{ applyResult.message }}
            </s-card>
          </div>

          <div v-if="validationFiles.length" class="q-mb-sm">
            <FormSection title="Validation" icon="fact_check">
              <div class="col-12">
                <div v-for="v in validationFiles" :key="v.path" class="row items-center q-gutter-xs validation-row">
                  <q-icon :name="v.valid ? 'check_circle' : 'cancel'" :color="v.valid ? 'positive' : 'negative'" size="16px" />
                  <span class="text-caption">{{ v.path }}</span>
                  <span v-if="!v.valid" class="text-caption text-negative">
                    {{ v.errors?.[0]?.message }}
                  </span>
                </div>
              </div>
            </FormSection>
          </div>

          <q-tabs v-model="tab" dense v-if="preview.model">
            <q-tab name="model" :label="tdc('Model')" />
            <q-tab name="serializer" :label="tdc('Serializer')" />
            <q-tab name="view" :label="tdc('View')" />
            <q-tab name="diff" :label="tdc('Diff')" />
          </q-tabs>

          <q-separator v-if="preview.model" />

          <q-tab-panels v-if="preview.model" v-model="tab" animated class="preview-panels">
            <q-tab-panel name="model" class="q-pa-none">
              <CodeEditor :model-value="preview.model" language="python" read-only style="height: 360px" />
            </q-tab-panel>
            <q-tab-panel name="serializer" class="q-pa-none">
              <CodeEditor :model-value="preview.serializer" language="python" read-only style="height: 360px" />
            </q-tab-panel>
            <q-tab-panel name="view" class="q-pa-none">
              <CodeEditor :model-value="preview.view" language="python" read-only style="height: 360px" />
            </q-tab-panel>
            <q-tab-panel name="diff" class="q-pa-none">
              <DiffViewer
                :path="`models/${form.model}.py`"
                :original="existingModelCode"
                :modified="preview.model"
                style="height: 360px"
              />
            </q-tab-panel>
          </q-tab-panels>

          <div v-else class="text-caption text-grey q-pa-lg text-center">
            {{ tdc('Choose an App + Model, add fields, then Generate Preview.') }}
          </div>
        </div>
      </div>

    <template #footer>
      <s-btn flat icon="visibility" :label="tdc('Generate Preview')" @click="generatePreview" />
      <s-btn
        color="primary" icon="save" :label="tdc('Apply Changes')"
        :loading="applying"
        :disable="!preview.model"
        @click="submit"
      />
    </template>
  </s-modal-card>
</template>

<script>
import { HTTPAuth, url } from '../../services/api.js'
import { useUserStore } from '../../stores/UserStore.js'
import { AlertError } from '../../boot/alerts.js'
import { tdc } from '../../services/translation'
import FormSection from '../auto/FormSection.vue'
import CodeEditor from './CodeEditor.vue'
import DiffViewer from './DiffViewer.vue'

// The original ScaffoldPage.vue's field-based "Model Generator" form -
// moved here verbatim (mega-prompt secção 117 "migração progressiva":
// preserve existing functionality, reposition it in the new IDE
// layout) - the only behavioural change is the flow after Generate:
// preview -> diff against the real current file (if any) -> Apply,
// and Apply's response now always carries per-file validation (scaffold.py's
// create() validates every generated file before writing any of them -
// see management/apicommands/view/scaffold.py). Two real pre-existing
// bugs fixed while moving it: `url` was used in submit()/
// loadModelsRelation()/loadModelsSchema() without being imported
// (ReferenceError - the App dropdown was actually broken before this).
export default {
  name: 'GeneratorPanel',

  components: { FormSection, CodeEditor, DiffViewer },

  emits: ['close', 'applied'],

  setup() {
    const User = useUserStore()
    return { User, tdc }
  },

  data() {
    return {
      tab: 'model',
      applying: false,
      applyResult: null,
      validationFiles: [],
      existingModelCode: '',

      accaoTeste: false,
      accao: {
        action: '', label: '', icon: 'list', tooltip: '', method: 'get',
        details: true, url: '', position: 'm', order: 0, visible: true,
        autorequest: false, permission: '',
      },

      newChoice: { label: '', key: '' },

      apps: [],
      models: [],
      filteredTypes: [],
      filteredMoneys: [],
      rawMoneys: ['MZN', 'USD', '...'],

      ICONS: [
        'menu', 'add', 'add_circle', 'edit', 'delete', 'visibility', 'search',
        'download', 'upload', 'save', 'refresh', 'home', 'dashboard', 'settings',
        'person', 'group', 'lock', 'email', 'phone', 'calendar_today', 'image',
        'folder', 'attach_file', 'list', 'inventory', 'apps', 'build',
        'shopping_cart', 'receipt', 'bar_chart', 'print', 'map', 'notifications',
        'help', 'warning', 'check_circle', 'close', 'code', 'terminal',
      ],

      rawTypes: [
        'CharField', 'TextField', 'EmailField', 'SlugField', 'URLField', 'UUIDField',
        'IntegerField', 'BigIntegerField', 'SmallIntegerField', 'PositiveIntegerField',
        'PositiveBigIntegerField', 'FloatField', 'DecimalField', 'BooleanField',
        'DateField', 'DateTimeField', 'TimeField', 'DurationField',
        'FileField', 'ImageField', 'JSONField', 'BinaryField',
        'ForeignKey', 'OneToOneField', 'ManyToManyField', 'MoneyField',
      ],

      onDeletes: ['CASCADE', 'PROTECT', 'SET_NULL', 'SET_DEFAULT', 'DO_NOTHING', 'RESTRICT'],

      form: { app: '', model: '', icon: 'list', crud: false, fields: [], actions: [] },

      preview: { model: '', serializer: '', view: '' },
    }
  },

  mounted() {
    this.loadApps()
    this.filteredTypes = this.rawTypes
    this.filteredMoneys = this.rawMoneys
  },

  methods: {
    filterTypes(val, update) {
      if (val === '') { update(() => { this.filteredTypes = this.rawTypes }); return }
      update(() => {
        const needle = val.toLowerCase()
        this.filteredTypes = this.rawTypes.filter(v => v.toLowerCase().indexOf(needle) > -1)
      })
    },

    filterMoneys(val, update) {
      if (val === '') { update(() => { this.filteredMoneys = this.rawMoneys }); return }
      update(() => {
        const needle = val.toLowerCase()
        this.filteredMoneys = this.rawMoneys.filter(v => v.toLowerCase().indexOf(needle) > -1)
      })
    },

    addField() {
      this.form.fields.push({ name: '', type: '', required: true, help_text: '', unique: false, choices: [] })
    },

    removeField(i) { this.form.fields.splice(i, 1) },

    addChoice(f) {
      if (!Array.isArray(f.choices)) f.choices = []
      if (this.newChoice.key !== '' && this.newChoice.label !== '') {
        f.choices.push({ ...this.newChoice })
        this.newChoice = { label: '', key: '' }
      } else {
        AlertError('Label, Key, or both are empty!')
      }
    },

    removeChoice(f, index) { f.choices.splice(index, 1) },

    addPerm() {
      if (!this.accao.action && !this.accao.permission) return
      if (!this.accao.method) return

      const action = String(this.accao.action || this.accao.permission || '').trim().toLowerCase()
      const permission = String(this.accao.permission || `${action}_${this.form.model || ''}`).trim().toLowerCase()

      this.form.actions.push({
        action,
        label: this.accao.label || action.replaceAll('_', ' '),
        icon: this.accao.icon || 'list',
        tooltip: this.accao.tooltip || '',
        method: this.accao.method,
        details: Boolean(this.accao.details),
        url: this.accao.url || action,
        position: this.accao.position || 'm',
        order: Number(this.accao.order || 0),
        visible: this.accao.visible !== false,
        autorequest: this.accao.autorequest === true,
        permission,
      })

      this.accao = {
        action: '', label: '', icon: 'list', tooltip: '', method: 'get',
        details: true, url: '', position: 'm', order: 0, visible: true,
        autorequest: false, permission: '',
      }
    },

    isRelation(f) { return ['ForeignKey', 'OneToOneField', 'ManyToManyField'].includes(f.type) },
    isFile(f) { return ['FileField', 'ImageField'].includes(f.type) },
    isDate(f) { return ['DateField', 'DurationField', 'DateTimeField'].includes(f.type) },
    isChar(f) { return f.type === 'CharField' },
    isInteger(f) { return f.type === 'IntegerField' },
    isDecimalOrMoney(f) { return ['MoneyField', 'DecimalField'].includes(f.type) },

    normalizeFields(fields) {
      return fields.map(f => {
        const field = {
          name: f.name, type: f.type, verbose_name: f.verbose_name, help_text: f.help_text,
          null: f.null, blank: f.blank, default: f.default, choices: f.choices, on_delete: f.on_delete,
          min: f.min, max: f.max, min_length: f.min_length, max_length: f.max_length,
          max_digits: f.max_digits, decimal_places: f.decimal_places, default_currency: f.default_currency,
          auto_now_add: f.auto_now_add, auto_now: f.auto_now, width_field: f.width_field, height_field: f.height_field,
        }
        if (f.relApp && f.relation) field.relation = `${f.relApp}.${f.relation}`
        return field
      })
    },

    async generatePreview() {
      this.applyResult = null
      this.validationFiles = []

      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields),
        actions: this.form.actions,
      }
      const { data } = await HTTPAuth.post('django_resaas/scaffolds/preview/', payload)
      this.preview = data.data || data || { model: '', serializer: '', view: '' }
      this.tab = 'model'

      // Best-effort: se o model já existir, mostra o diff contra o
      // ficheiro real (update); se ainda não existir, diff contra "".
      this.existingModelCode = ''
      try {
        const fileName = this.form.model.charAt(0).toLowerCase() + this.form.model.slice(1)
        const { data: existing } = await HTTPAuth.get(
          url({ type: 'u', url: 'django_resaas/ide/read/', params: { root: this.form.app, path: `models/${fileName}.py` } })
        )
        this.existingModelCode = existing?.content || ''
      } catch (e) {
        // novo model - sem ficheiro anterior, diff fica contra "".
      }
    },

    async generateMigrate() {
      const payload = { app: this.form.app }
      const { data } = await HTTPAuth.post('django_resaas/scaffolds/migrate/', payload)
      return data.out
    },

    async permissionUpdade() {
      const payload = { app: this.form.app, model: this.form.model, actions: this.form.actions }
      await HTTPAuth.post('django_resaas/scaffolds/permissions/', payload)
    },

    async reloadModelShema() {
      if (!this.form.app || !this.form.model) return
      this.accaoTeste = false

      const { buildFormFromSchema } = await import('../../utils/autoForm.js')
      const data = await buildFormFromSchema({ app: this.form.app, model: this.form.model })

      this.form.fields = (data.fields || []).filter(f =>
        !['id', 'created_at', 'is_deleted', 'updated_at', 'state', 'created_by', 'updated_by', 'deleted_at', 'entity', 'branch'].includes(f?.name)
      )
      this.form.actions = (data.actions || []).map(a => ({ ...a }))
      this.form.crud = data.schema?.ui?.crud ?? data.config?.crud ?? this.form.crud
      this.form.icon = data.schema?.ui?.icon ?? this.form.icon

      this.accaoTeste = true
    },

    // Mega-prompt regra principal: ScaffoldAPIView.create() agora
    // valida sintaxe/imports de TODOS os ficheiros gerados (Python +
    // Vue/JS) ANTES de escrever qualquer um - ver management/
    // apicommands/view/scaffold.py. Uma falha aqui nunca escreve nada.
    async submit() {
      this.applying = true
      this.applyResult = null
      this.validationFiles = []

      const payload = { ...this.form, fields: this.normalizeFields(this.form.fields) }

      try {
        const { data } = await HTTPAuth.post(
          url({ type: 'u', url: 'django_resaas/scaffolds/', params: {} }),
          payload
        )
        this.applyResult = { ok: true, message: data.alert_success || tdc('Model created successfully') }
        this.validationFiles = data.validations || []
        this.emit_applied()
      } catch (e) {
        const response = e?.response
        this.applyResult = { ok: false, message: tdc('Validation failed - nothing was written') }
        this.validationFiles = response?.data?.files || []
      } finally {
        this.applying = false
      }
    },

    emit_applied() {
      this.$emit('applied', { app: this.form.app, model: this.form.model })
    },

    async loadApps() {
      const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} }))
      this.apps = data?.apps || []
    },

    async loadModelsRelation(f) {
      if (!f?.relApp) return
      const { data } = await HTTPAuth.get(
        url({ type: 'u', url: `django_resaas/resaasapps/${f.relApp}/`, params: {} })
      )
      f.models = data?.models || []
    },

    async loadModelsSchema(app) {
      this.models = []
      this.form.model = ''
      this.form.fields = []
      this.form.actions = []
      this.accaoTeste = false

      if (!app) return

      const { data } = await HTTPAuth.get(
        url({ type: 'u', url: `django_resaas/resaasapps/${app}/`, params: {} })
      )
      this.models = data?.models || []
    },
  },
}
</script>

<style scoped>
.preview-panels {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}

.validation-row {
  padding: 2px 0;
}
</style>
