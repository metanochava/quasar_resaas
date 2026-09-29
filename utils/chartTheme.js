// Colours of every chart (s-chart, components/engine/ChartComponent.vue).
//
// They come from the Entity's Theme, the backend configuration
// (django_resaas.saas.models.theme.Theme, User.Theme), in a FIXED order -
// a series keeps its colour when the others change. A series or slice can
// also ask for a semantic colour by name ('positive', 'negative', 'warning',
// 'info', 'primary', ...): the status colours are the Theme's too.
//
// A colour the Theme does not define falls back to the validated categorical
// palette below (the same eight hues stepped for light and dark surfaces,
// checked for colour-vision deficiency), never to a generated colour.

export const THEME_ORDER = ['primary', 'secondary', 'accent', 'info', 'positive', 'warning', 'negative']

export const SEMANTIC_COLORS = [...THEME_ORDER, 'dark']

export const FALLBACK_PALETTE = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
}

const isColor = (value) => typeof value === 'string' && value.trim() !== ''

function cssVar (name) {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(`--q-${name}`).trim()
}

// the Theme's value for a named colour, or the CSS variable applyTheme() set
export function themeColor (theme, name) {
  const value = theme?.[name]
  return isColor(value) ? value.trim() : cssVar(name)
}

// the series colours, in order: the Theme's, then the validated palette
export function chartColors (theme, dark = false) {
  const fallback = FALLBACK_PALETTE[dark ? 'dark' : 'light']
  const colors = THEME_ORDER.map((name, i) => themeColor(theme, name) || fallback[i])
  for (const color of fallback) if (!colors.includes(color)) colors.push(color)
  return colors
}

// a colour asked for by a series/slice: a Theme name or a literal colour
export function resolveColor (theme, value) {
  if (!isColor(value)) return null
  return SEMANTIC_COLORS.includes(value) ? (themeColor(theme, value) || null) : value
}

// ink, grid and surface of the chart, from the Theme when it has them
export function chartSurface (theme, dark = false) {
  return dark
    ? {
        text: 'rgba(255, 255, 255, 0.72)',
        grid: 'rgba(255, 255, 255, 0.08)',
        surface: themeColor(theme, 'dark') || '#1d1d1d'
      }
    : {
        text: (isColor(theme?.text_secondary) && theme.text_secondary) || '#52514e',
        grid: 'rgba(0, 0, 0, 0.07)',
        surface: (isColor(theme?.card) && theme.card) || '#ffffff'
      }
}
