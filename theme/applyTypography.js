import { unwrapChoice } from './unwrapChoice.js'

// Aplica a Typography efectiva globalmente (fonte, tamanho base,
// altura de linha, espaçamento) - utilitário centralizado em vez de
// mexer directamente e de forma dispersa em document.body.style (ver
// CLAUDE.md secção 9).
//
// django_resaas.saas.models.typography.Typography.font_family é um
// CharField com choices - unwrapChoice() trata tanto a forma
// serializada por DRF ({id, value, label}) como a string simples de
// User.get_ui_config().
export function applyTypography(typography = {}) {
  const font = unwrapChoice(typography.font_family) || 'Roboto'

  let link = document.getElementById('dynamic-theme-font')

  const fontHref = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;700&display=swap`

  if (!link) {
    link = document.createElement('link')
    link.id = 'dynamic-theme-font'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  if (link.href !== fontHref) {
    link.href = fontHref
  }

  document.body.style.fontFamily = font

  if (typography.font_size_base) {
    document.body.style.fontSize = `${typography.font_size_base}px`
  }

  if (typography.line_height) {
    document.body.style.lineHeight = typography.line_height
  }

  if (typography.letter_spacing !== undefined && typography.letter_spacing !== null) {
    document.body.style.letterSpacing = `${typography.letter_spacing}px`
  }
}
