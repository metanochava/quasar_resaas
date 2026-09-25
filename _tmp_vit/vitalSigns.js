// Vital signs: field definitions, adult reference bands and derived values,
// shared by VitalSignsDialog.vue (recording) and LatestVitalSigns.vue (the
// last record, e.g. on top of the consultation form). Pure functions only:
// decision support shown in the UI, never stored and never a diagnosis.

export const num = (value) => (value === null || value === undefined || value === '' ? null : Number(value))
export const round = (value, places = 1) => (value === null || !Number.isFinite(value) ? null : Number(value.toFixed(places)))

// ------------------------------------------------------------ definitions
export const TIPOS = [
  { value: 'triagem', label: 'Triage' },
  { value: 'consulta', label: 'Consultation' },
  { value: 'urgencia', label: 'Emergency' },
  { value: 'internamento', label: 'Inpatient' }
]

export const CONSCIOUSNESS = [
  { value: 'alerta', label: 'Alert' },
  { value: 'sonolento', label: 'Drowsy' },
  { value: 'confuso', label: 'Confused' },
  { value: 'inconsciente', label: 'Unconscious' }
]

export const SECTIONS = [
  {
    name: 'vitals',
    label: 'Vital signs',
    icon: 'favorite',
    fields: [
      {
        key: 'temperatura', label: 'Temperature', icon: 'device_thermostat', step: 0.1,
        choices: {
          key: 'temperatura_local',
          options: [
            { value: 'axilar', label: 'Axillary' }, { value: 'oral', label: 'Oral' },
            { value: 'timpanica', label: 'Tympanic' }, { value: 'retal', label: 'Rectal' }
          ]
        },
        cols: 'col-12 col-sm-6'
      },
      { key: 'saturacao_oxigenio', label: 'Oxygen saturation', icon: 'air', step: 1, cols: 'col-6 col-sm-3' },
      { key: 'frequencia_cardiaca', label: 'Heart rate', icon: 'monitor_heart', step: 1, cols: 'col-6 col-sm-3' },
      { key: 'ta_sistolica', label: 'Systolic pressure', icon: 'bloodtype', step: 1 },
      { key: 'ta_diastolica', label: 'Diastolic pressure', icon: 'bloodtype', step: 1 },
      { key: 'frequencia_respiratoria', label: 'Respiratory rate', icon: 'airline_seat_flat', step: 1 },
      { key: 'pulso', label: 'Pulse', icon: 'timeline', step: 1, cols: 'col-6 col-sm-4' },
      {
        key: 'glicemia', label: 'Blood glucose', icon: 'water_drop', step: 1,
        choices: {
          key: 'glicemia_momento',
          options: [
            { value: 'jejum', label: 'Fasting' }, { value: 'pos_prandial', label: 'Postprandial' },
            { value: 'aleatoria', label: 'Random' }
          ]
        },
        cols: 'col-12 col-sm-8'
      },
      { key: 'glasgow', label: 'Glasgow (3-15)', icon: 'psychology_alt', step: 1, cols: 'col-6 col-sm-4' }
    ]
  },
  {
    name: 'body',
    label: 'Anthropometry',
    icon: 'straighten',
    fields: [
      { key: 'peso', label: 'Weight', icon: 'monitor_weight', step: 0.1 },
      { key: 'altura', label: 'Height', icon: 'height', step: 0.01 },
      { key: 'circunferencia_abdominal', label: 'Waist circumference', icon: 'straighten', step: 0.1 }
    ]
  }
]

export const MEASURED = [...SECTIONS.flatMap(s => s.fields.map(f => f.key)), 'dor']
export const LEVEL_COLORS = { normal: 'positive', attention: 'amber-8', warning: 'orange-9', critical: 'negative' }

// ------------------------------------------------------------ status (adult references)
export const band = (value, bands) => {
  for (const [test, level, label] of bands) if (test(value)) return { level, label }
  return { level: 'normal', label: '' }
}

export const RULES = {
  temperatura: v => band(v, [
    [x => x < 35, 'critical', 'Hypothermia'],
    [x => x < 36, 'attention', 'Low'],
    [x => x >= 39.5, 'critical', 'High fever'],
    [x => x >= 38, 'warning', 'Fever'],
    [x => x >= 37.5, 'attention', 'Low-grade fever']
  ]),
  saturacao_oxigenio: v => band(v, [
    [x => x < 90, 'critical', 'Severe hypoxaemia'],
    [x => x < 95, 'attention', 'Low']
  ]),
  frequencia_cardiaca: v => band(v, [
    [x => x < 50, 'critical', 'Bradycardia'],
    [x => x < 60, 'attention', 'Bradycardia'],
    [x => x > 120, 'critical', 'Tachycardia'],
    [x => x > 100, 'attention', 'Tachycardia']
  ]),
  pulso: v => RULES.frequencia_cardiaca(v),
  frequencia_respiratoria: v => band(v, [
    [x => x < 10, 'critical', 'Bradypnoea'],
    [x => x < 12, 'attention', 'Low'],
    [x => x >= 30, 'critical', 'Tachypnoea'],
    [x => x > 20, 'attention', 'Tachypnoea']
  ]),
  ta_sistolica: v => band(v, [
    [x => x < 90, 'critical', 'Hypotension'],
    [x => x >= 180, 'critical', 'Hypertensive crisis'],
    [x => x >= 140, 'warning', 'Hypertension'],
    [x => x >= 130, 'attention', 'Elevated']
  ]),
  ta_diastolica: v => band(v, [
    [x => x < 60, 'attention', 'Low'],
    [x => x >= 120, 'critical', 'Hypertensive crisis'],
    [x => x >= 90, 'warning', 'Hypertension'],
    [x => x >= 85, 'attention', 'Elevated']
  ]),
  glicemia: (v, values = {}) => {
    if (v < 54) return { level: 'critical', label: 'Hypoglycaemia' }
    if (v < 70) return { level: 'warning', label: 'Hypoglycaemia' }
    if (v > 400) return { level: 'critical', label: 'Severe hyperglycaemia' }
    const fasting = values.glicemia_momento === 'jejum'
    if (fasting) {
      if (v >= 126) return { level: 'warning', label: 'Hyperglycaemia' }
      if (v >= 100) return { level: 'attention', label: 'Impaired fasting glucose' }
    } else {
      if (v >= 200) return { level: 'warning', label: 'Hyperglycaemia' }
      if (v >= 140) return { level: 'attention', label: 'Elevated' }
    }
    return { level: 'normal', label: '' }
  },
  glasgow: v => band(v, [
    [x => x <= 8, 'critical', 'Severe'],
    [x => x <= 12, 'warning', 'Moderate'],
    [x => x <= 14, 'attention', 'Mild']
  ]),
  dor: v => band(v, [
    [x => x >= 7, 'warning', 'Severe pain'],
    [x => x >= 4, 'attention', 'Moderate pain'],
    [x => x >= 1, 'normal', 'Mild pain']
  ])
}

// { level: none|normal|attention|warning|critical, label } for one measurement
export function vitalStatus(key, values) {
  const value = num(values?.[key])
  if (value === null || !RULES[key]) return { level: 'none', label: '' }
  return RULES[key](value, values)
}

// ------------------------------------------------------------ calculations
export function vitalCalculations(values) {
  const weight = num(values.peso)
  const height = num(values.altura)
  const sys = num(values.ta_sistolica)
  const dia = num(values.ta_diastolica)
  const hr = num(values.frequencia_cardiaca)
  const waist = num(values.circunferencia_abdominal)

  const bmi = weight && height ? round(weight / (height * height), 1) : null
  const map = sys && dia ? round((sys + 2 * dia) / 3, 0) : null
  const pulsePressure = sys && dia ? sys - dia : null
  const shock = hr && sys ? round(hr / sys, 2) : null
  const waistHeight = waist && height ? round(waist / (height * 100), 2) : null

  return [
    {
      key: 'bmi', label: 'Body mass index', value: bmi, unit: 'kg/m²',
      status: bmi === null ? null : band(bmi, [
        [x => x < 18.5, 'attention', 'Underweight'],
        [x => x < 25, 'normal', 'Normal weight'],
        [x => x < 30, 'attention', 'Overweight'],
        [x => x < 35, 'warning', 'Obesity class I'],
        [x => x < 40, 'warning', 'Obesity class II'],
        [() => true, 'critical', 'Obesity class III']
      ])
    },
    { key: 'ideal_weight', label: 'Ideal weight (BMI 22)', value: height ? round(22 * height * height, 1) : null, unit: 'kg', status: null },
    {
      key: 'map', label: 'Mean arterial pressure', value: map, unit: 'mmHg',
      status: map === null ? null : band(map, [[x => x < 65, 'critical', 'Low'], [x => x > 110, 'warning', 'High']])
    },
    {
      key: 'pulse_pressure', label: 'Pulse pressure', value: pulsePressure, unit: 'mmHg',
      status: pulsePressure === null ? null : band(pulsePressure, [[x => x < 25, 'attention', 'Narrow'], [x => x > 60, 'attention', 'Wide']])
    },
    {
      key: 'shock_index', label: 'Shock index', value: shock, unit: '',
      status: shock === null ? null : band(shock, [[x => x >= 1.3, 'critical', 'High'], [x => x > 0.9, 'warning', 'Elevated']])
    },
    {
      key: 'waist_height', label: 'Waist-to-height ratio', value: waistHeight, unit: '',
      status: waistHeight === null ? null : band(waistHeight, [[x => x >= 0.6, 'warning', 'High risk'], [x => x >= 0.5, 'attention', 'Increased risk']])
    }
  ]
}

export const FIELD_LABELS = Object.fromEntries([
  ...SECTIONS.flatMap(s => s.fields.map(f => [f.key, f.label])),
  ['dor', 'Pain (0-10)']
])

// measurements and calculations outside the normal range, most severe first
export function vitalAlerts(values, calculations, statusOf = (key) => vitalStatus(key, values)) {
  return [
  ...MEASURED
    .map(key => ({ key, field: FIELD_LABELS[key], ...statusOf(key) }))
    .filter(s => ['attention', 'warning', 'critical'].includes(s.level)),
  ...calculations
    .filter(c => c.status && ['warning', 'critical'].includes(c.status.level))
    .map(c => ({ key: `calc-${c.key}`, field: c.label, ...c.status }))
].sort((a, b) => ['critical', 'warning', 'attention'].indexOf(a.level) - ['critical', 'warning', 'attention'].indexOf(b.level))
}
