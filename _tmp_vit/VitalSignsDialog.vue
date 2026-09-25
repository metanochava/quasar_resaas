<template>
  <q-dialog v-model="open" persistent>
    <s-modal-card
      :title="tdc('Record vital signs')"
      icon="monitor_heart"
      width="1080px"
      form
      data-test="vital-signs-dialog"
      @close="open = false"
      @submit="save"
    >
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="42px" />
      </div>

      <div v-else-if="loadError" class="column flex-center q-pa-xl text-negative" data-test="vital-signs-load-error">
        <q-icon name="error_outline" size="36px" />
        <div class="q-mt-sm text-center">{{ loadError }}</div>
      </div>

      <div v-else-if="ctx" class="vitals">
        <!-- ============ who / what: filled in by the server, read only ============ -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-md-5">
            <div class="vitals-context" data-test="vital-signs-patient">
              <q-avatar size="52px" class="vitals-context__avatar">
                <img v-if="patient?.photo" :src="patient.photo" alt="">
                <span v-else>{{ initials(patient?.full_name) }}</span>
              </q-avatar>
              <div class="q-ml-md ellipsis">
                <div class="text-caption text-grey-6">{{ tdc('Patient') }}</div>
                <div class="text-subtitle1 text-weight-medium ellipsis">{{ patient?.full_name || '-' }}</div>
                <div class="text-caption">
                  <span v-if="patient?.age !== null && patient?.age !== undefined">{{ patient.age }} {{ tdc('years') }}</span>
                  <span v-if="patient?.gender"> · {{ tdc(displayValue(patient.gender)) }}</span>
                  <span v-if="ctx.patient.nid"> · {{ ctx.patient.nid }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-4">
            <div class="vitals-context">
              <q-icon name="event" size="28px" color="primary" />
              <div class="q-ml-md ellipsis">
                <div class="text-caption text-grey-6">{{ tdc('Appointment') }}</div>
                <div class="text-body2 text-weight-medium">{{ ctx.agenda.date }} {{ ctx.agenda.time || '' }}</div>
                <div class="text-caption ellipsis">
                  {{ tdc('Doctor') }}: {{ ctx.doctor?.full_name || '-' }}
                  <span v-if="ctx.agenda.checked_in_at"> · {{ tdc('Check-in') }} {{ timeOf(ctx.agenda.checked_in_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <div class="vitals-context" data-test="vital-signs-professional">
              <q-icon name="badge" size="28px" color="primary" />
              <div class="q-ml-md ellipsis">
                <div class="text-caption text-grey-6">{{ tdc('Recorded by') }}</div>
                <div class="text-body2 text-weight-medium ellipsis">{{ ctx.professional.person?.full_name }}</div>
                <div v-if="ctx.professional.position" class="text-caption ellipsis">{{ ctx.professional.position }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row items-center q-mb-md q-gutter-sm">
          <span class="text-caption text-grey-7">{{ tdc('Type') }}</span>
          <q-btn-toggle
            v-model="tipo"
            no-caps rounded unelevated dense
            toggle-color="primary"
            :options="TIPOS.map(t => ({ value: t.value, label: tdc(t.label) }))"
            data-test="vital-signs-type"
          />
        </div>

        <div class="row q-col-gutter-md">
          <!-- ============ what is typed: the vital signs only ============ -->
          <div class="col-12 col-md-8">
            <div v-for="section in SECTIONS" :key="section.name" class="q-mb-md">
              <div class="vitals-section-title">
                <q-icon :name="section.icon" size="18px" /> {{ tdc(section.label) }}
              </div>

              <div class="row q-col-gutter-sm">
                <div v-for="f in section.fields" :key="f.key" :class="f.cols || 'col-6 col-sm-4'">
                  <div class="vital-tile" :class="`vital-tile--${statusOf(f.key).level}`" :data-test="`vital-${f.key}`">
                    <div class="row items-center no-wrap">
                      <q-icon :name="f.icon" size="18px" class="vital-tile__icon" />
                      <div class="vital-tile__label ellipsis">{{ tdc(f.label) }}</div>
                      <q-space />
                      <q-badge v-if="statusOf(f.key).label" :color="LEVEL_COLORS[statusOf(f.key).level]" class="vital-tile__badge">
                        {{ tdc(statusOf(f.key).label) }}
                      </q-badge>
                    </div>

                    <s-input
                      v-model="values[f.key]"
                      type="number"
                      :step="f.step"
                      :min="limit(f.key)?.min"
                      :max="limit(f.key)?.max"
                      :suffix="limit(f.key)?.unit || undefined"
                      borderless
                      dense
                      input-class="vital-tile__value"
                      :error="!!errors[f.key]"
                      :error-message="errors[f.key]"
                      @update:model-value="checkField(f.key)"
                    />

                    <div v-if="f.choices" class="q-mt-xs">
                      <q-btn-toggle
                        v-model="values[f.choices.key]"
                        size="sm" no-caps dense unelevated flat
                        toggle-color="primary"
                        :options="f.choices.options.map(o => ({ value: o.value, label: tdc(o.label) }))"
                      />
                    </div>

                    <div v-if="previousOf(f.key) !== null" class="vital-tile__previous">
                      {{ tdc('Previous') }}: {{ previousOf(f.key) }} {{ limit(f.key)?.unit || '' }}
                      <span v-if="deltaOf(f.key)" :class="deltaOf(f.key) > 0 ? 'text-orange-8' : 'text-blue-7'">
                        <q-icon :name="deltaOf(f.key) > 0 ? 'arrow_upward' : 'arrow_downward'" size="12px" />{{ Math.abs(deltaOf(f.key)) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- clinical assessment -->
            <div class="vitals-section-title"><q-icon name="psychology" size="18px" /> {{ tdc('Clinical assessment') }}</div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="vital-tile" :class="`vital-tile--${statusOf('dor').level}`" data-test="vital-dor">
                  <div class="row items-center no-wrap">
                    <q-icon name="sentiment_dissatisfied" size="18px" class="vital-tile__icon" />
                    <div class="vital-tile__label">{{ tdc('Pain (0-10)') }}</div>
                    <q-space />
                    <span class="text-h6 q-mr-xs">{{ values.dor ?? '-' }}</span>
                    <q-badge v-if="statusOf('dor').label" :color="LEVEL_COLORS[statusOf('dor').level]">{{ tdc(statusOf('dor').label) }}</q-badge>
                  </div>
                  <q-slider v-model="values.dor" :min="0" :max="10" :step="1" markers snap label :color="LEVEL_COLORS[statusOf('dor').level] || 'primary'" />
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="vital-tile">
                  <div class="row items-center no-wrap q-mb-xs">
                    <q-icon name="visibility" size="18px" class="vital-tile__icon" />
                    <div class="vital-tile__label">{{ tdc('Level of consciousness') }}</div>
                  </div>
                  <q-btn-toggle
                    v-model="values.estado_consciencia"
                    size="sm" no-caps dense unelevated spread
                    toggle-color="primary"
                    :options="CONSCIOUSNESS.map(o => ({ value: o.value, label: tdc(o.label) }))"
                    data-test="vital-estado_consciencia"
                  />
                </div>
              </div>
              <div class="col-12">
                <s-input v-model="values.observacao" type="textarea" autogrow label="Notes" data-test="vital-observacao" />
              </div>
            </div>
          </div>

          <!-- ============ calculations, live ============ -->
          <div class="col-12 col-md-4">
            <div class="vitals-panel" data-test="vital-signs-calculations">
              <div class="vitals-section-title q-mt-none"><q-icon name="calculate" size="18px" /> {{ tdc('Calculations') }}</div>

              <div v-for="calc in calculations" :key="calc.key" class="vitals-calc" :data-test="`calc-${calc.key}`">
                <div>
                  <div class="text-caption text-grey-7">{{ tdc(calc.label) }}</div>
                  <div class="text-h6">{{ calc.value ?? '-' }} <span class="text-caption">{{ calc.value !== null ? calc.unit : '' }}</span></div>
                </div>
                <q-badge v-if="calc.status" :color="LEVEL_COLORS[calc.status.level]">{{ tdc(calc.status.label) }}</q-badge>
              </div>

              <div class="vitals-section-title q-mt-md"><q-icon name="notification_important" size="18px" /> {{ tdc('Alerts') }}</div>
              <div v-if="!alerts.length" class="text-caption text-grey-6" data-test="vital-signs-no-alerts">
                {{ tdc('No values outside the normal range.') }}
              </div>
              <div v-for="a in alerts" :key="a.key" class="vitals-alert" :class="`vitals-alert--${a.level}`" data-test="vital-signs-alert">
                <q-icon :name="a.level === 'critical' ? 'error' : 'warning'" size="16px" />
                <span>{{ tdc(a.field) }}: {{ tdc(a.label) }}</span>
              </div>

              <div v-if="ctx.previous" class="text-caption text-grey-6 q-mt-md">
                {{ tdc('Previous record') }}: {{ dateTimeOf(ctx.previous.created_at) }}
              </div>
              <div class="text-caption text-grey-6 q-mt-sm">
                {{ tdc('Reference values for adults. They support, and never replace, clinical judgement.') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <s-btn flat :label="tdc('Cancel')" @click="open = false" />
        <s-btn
          color="primary" icon="save" type="submit" unelevated
          :label="tdc('Save vital signs')"
          :loading="saving"
          :disable="!canSave"
          data-test="vital-signs-save"
        />
      </template>
    </s-modal-card>
  </q-dialog>
</template>

<script setup>
// "Record vital signs" from a dashboard queue row (saude/dashboard.py
// _RECORD_VITALS, registered in pages/saude/dashboard/dashboard.js). The row
// is the appointment: GET dadovitals/intake/ brings the patient, the doctor,
// the professional signed in, the previous record and the limits - only the
// vital signs are typed. POST dadovitals/ stores them; the server sets the
// professional, the patient and the consultation (vital_signs_service).
// Status colours and calculations are decision support, not a diagnosis.
import { computed, reactive, ref, watch } from 'vue'
import { HTTPAuth, url, tdc, displayValue, AlertSuccess } from './resaas_mock.js'
import {
  TIPOS, CONSCIOUSNESS, SECTIONS, MEASURED, LEVEL_COLORS,
  num, round, vitalStatus, vitalCalculations, vitalAlerts
} from './vitalSigns'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // the dashboard row: { id: <Agenda id>, paciente_id, patient, ... }
  context: { type: Object, default: null },
  action: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// ------------------------------------------------------------ definitions
// definitions, reference bands and calculations: ./vitalSigns.js (shared)

// ------------------------------------------------------------ state
const loading = ref(false)
const loadError = ref(null)
const saving = ref(false)
const ctx = ref(null)
const tipo = ref('triagem')
const values = reactive({})
const errors = reactive({})

const patient = computed(() => ctx.value?.patient?.person || null)

function blank() {
  for (const key of Object.keys(values)) delete values[key]
  for (const key of Object.keys(errors)) delete errors[key]
  values.temperatura_local = 'axilar'
  values.glicemia_momento = 'aleatoria'
  values.dor = null
  values.estado_consciencia = null
  values.observacao = ''
}

async function load() {
  const agendaId = props.context?.id
  if (!agendaId) return
  blank()
  ctx.value = null
  loadError.value = null
  loading.value = true
  try {
    const { data } = await HTTPAuth.get(url({ type: 'u', url: 'saude/dadovitals/intake/', params: { agenda: agendaId } }))
    ctx.value = data
    tipo.value = data.tipo || 'triagem'
  } catch (error) {
    loadError.value = error?.response?.data?.error?.message || tdc('Could not load the appointment.')
  } finally {
    loading.value = false
  }
}

watch(() => [props.modelValue, props.context?.id], ([isOpen]) => { if (isOpen) load() }, { immediate: true })

// ------------------------------------------------------------ helpers
const limit = (key) => ctx.value?.limits?.[key] || null

function initials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?'
}
function timeOf(iso) { return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }
function dateTimeOf(iso) { return iso ? new Date(iso).toLocaleString() : '-' }

function previousOf(key) {
  const value = ctx.value?.previous?.[key]
  return value === null || value === undefined ? null : Number(value)
}
function deltaOf(key) {
  const now = num(values[key])
  const before = previousOf(key)
  if (now === null || before === null) return null
  const delta = round(now - before, 2)
  return delta === 0 ? null : delta
}

function checkField(key) {
  const value = num(values[key])
  const range = limit(key)
  if (value === null || !range) {
    delete errors[key]
    return
  }
  if (value < range.min || value > range.max) {
    errors[key] = `${tdc('Out of range')}: ${range.min}–${range.max} ${range.unit || ''}`.trim()
  } else {
    delete errors[key]
  }
  if (key === 'ta_sistolica' || key === 'ta_diastolica') checkPressure()
}

function checkPressure() {
  const sys = num(values.ta_sistolica)
  const dia = num(values.ta_diastolica)
  if (sys !== null && dia !== null && dia >= sys) {
    errors.ta_diastolica = tdc('The diastolic pressure must be lower than the systolic.')
  } else if (errors.ta_diastolica === tdc('The diastolic pressure must be lower than the systolic.')) {
    delete errors.ta_diastolica
  }
}

function statusOf(key) {
  if (errors[key]) return { level: 'none', label: '' }
  return vitalStatus(key, values)
}

const calculations = computed(() => vitalCalculations(values))
const alerts = computed(() => vitalAlerts(values, calculations.value, statusOf))

// ------------------------------------------------------------ save
const hasMeasurement = computed(() =>
  MEASURED.some(key => num(values[key]) !== null) || !!values.estado_consciencia
)
const canSave = computed(() => !!ctx.value && hasMeasurement.value && !Object.keys(errors).length && !saving.value)

function payload() {
  const body = { agenda: ctx.value.agenda.id, tipo: tipo.value }
  for (const key of MEASURED) {
    const value = num(values[key])
    if (value !== null) body[key] = value
  }
  if (body.temperatura !== undefined) body.temperatura_local = values.temperatura_local
  if (body.glicemia !== undefined) body.glicemia_momento = values.glicemia_momento
  if (values.estado_consciencia) body.estado_consciencia = values.estado_consciencia
  if (values.observacao?.trim()) body.observacao = values.observacao.trim()
  return body
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    const { data } = await HTTPAuth.post(url({ type: 'u', url: 'saude/dadovitals/' }), payload())
    AlertSuccess(tdc('Vital signs recorded.'))
    emit('saved', data)
  } catch (error) {
    // field errors stay on their tiles; the message goes through the alert funnel
    const details = error?.response?.data?.error?.details || {}
    for (const [key, messages] of Object.entries(details)) errors[key] = tdc([].concat(messages)[0])
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.vitals-context {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(25, 118, 210, 0.06);
  border: 1px solid rgba(25, 118, 210, 0.14);
}
.vitals-context__avatar {
  background: var(--q-primary);
  color: #fff;
  font-weight: 600;
}
.vitals-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  opacity: .75;
}
.vital-tile {
  height: 100%;
  padding: 10px 12px 6px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 4px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.015);
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.vital-tile:focus-within {
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.25);
}
.vital-tile--normal { border-left-color: var(--q-positive); }
.vital-tile--attention { border-left-color: #f9a825; background: rgba(249, 168, 37, 0.06); }
.vital-tile--warning { border-left-color: #ef6c00; background: rgba(239, 108, 0, 0.07); }
.vital-tile--critical { border-left-color: var(--q-negative); background: rgba(193, 0, 21, 0.07); }
.vital-tile__icon { opacity: .7; margin-right: 6px; }
.vital-tile__label { font-size: 12px; opacity: .8; }
.vital-tile__badge { margin-left: 6px; }
.vital-tile :deep(.vital-tile__value) {
  font-size: 22px;
  font-weight: 600;
}
.vital-tile__previous {
  font-size: 11px;
  opacity: .7;
  padding-bottom: 2px;
}
.vitals-panel {
  position: sticky;
  top: 0;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
}
.vitals-calc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}
.vitals-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
}
.vitals-alert--attention { background: rgba(249, 168, 37, 0.14); }
.vitals-alert--warning { background: rgba(239, 108, 0, 0.14); }
.vitals-alert--critical { background: rgba(193, 0, 21, 0.14); }

.body--dark .vital-tile,
.body--dark .vitals-panel { border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.03); }
.body--dark .vitals-calc { border-bottom-color: rgba(255, 255, 255, 0.12); }
</style>
