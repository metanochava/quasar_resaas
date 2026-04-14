import {
  QInput,
  QSelect,
  QCheckbox,
  QToggle,
  QRadio,
  QOptionGroup,
  QDate,
  QTime,
  QFile,
  QUploader,
  QEditor,
  QSlider,
  QRange,
  QKnob,
  QField
} from 'quasar'

import InputComponent from '../components/engine/InputComponent.vue'
import SelectComponent from '../components/engine/SelectComponent.vue'
import BtnComponent from '../components/engine/BtnComponent.vue'

export const componentMap = {

  // BTN

  "q-btn": BtnComponent,

  // 🔤 TEXT / INPUT
  // 'q-input': QInput,
  'q-input': InputComponent,
  'q-field': QField,

  // 🔽 SELECT / RELATIONS
  // 'q-select': QSelect,
  'q-select': SelectComponent,
  'q-multiselect': QSelect,     // 🔥 backend ManyToMany
  'q-option-group': QOptionGroup,

  // ✅ BOOLEAN
  'q-checkbox': QCheckbox,
  'q-switch': QToggle,
  'q-toggle': QToggle,        // 🔥 backend BooleanField
  'q-radio': QRadio,

  // 📅 DATE / TIME
  'q-date': QDate,
  'q-time': QTime,

  // 📂 FILES
  'q-upload': QFile,
  'q-uploader': QUploader,

  // 🔥 CRÍTICO (faltava)
  'q-file': QFile,
  'q-image': QFile,

  // ✍️ RICH TEXT
  'q-editor': QEditor,

  // 🎚 NUMERIC / RANGE
  'q-slider': QSlider,
  'q-range': QRange,
  'q-knob': QKnob,
}