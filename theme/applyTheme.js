import { Dark, setCssVar } from 'quasar'

// Campos do Theme que não são cores e por isso não devem ir para
// setCssVar() (ver django_resaas.saas.models.theme.Theme.to_dict()).
const IGNORED_KEYS = [
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'state',
  'name',
  'created_by',
  'updated_by',
  'surfaces',
]

function isColorValue(value) {
  return typeof value === 'string' && value.trim() !== ''
}

// Aplica o Theme (cores) globalmente: variáveis Quasar (setCssVar) +
// variáveis CSS próprias do sistema (--input-*, --btn-*, --text-*) já
// usadas pelos componentes s-*.
export function applyTheme(theme = {}) {
  const root = document.documentElement

  Object.entries(theme).forEach(([key, value]) => {
    if (IGNORED_KEYS.includes(key)) return
    if (!isColorValue(value)) return

    setCssVar(key, value)
  })

  root.style.setProperty('--input-bg', theme.input_background || '#ffffff')
  root.style.setProperty('--input-border', theme.input_border || '#ccc')
  root.style.setProperty('--input-focus', theme.input_focus || '#1976D2')

  root.style.setProperty('--btn-primary', theme.button_primary || '')
  root.style.setProperty('--btn-primary-text', theme.button_primary_text || '')

  root.style.setProperty('--text-primary', theme.text_primary || '')
  root.style.setProperty('--text-secondary', theme.text_secondary || '')

  document.body.style.background = Dark.isActive
    ? (theme.background_dark || theme.background || '')
    : (theme.background || theme.background_dark || '')
}
