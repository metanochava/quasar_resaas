// LEGACY (mantido de propósito - ainda em uso activo):
//
// Converte um "background config" resolvido pelo backend
// ({type: 'color'|'gradient'|'image'|'transparent', value}) num
// objecto de style Vue - mesma lógica já usada por
// pages/auth/LoginPage.vue's loginBackgroundStyle(), generalizada
// para reutilização em header/footer (ver InterfaceConfigService no
// backend - django_resaas.saas.data.user.views.user.py's
// update_interface/reset_interface/_interface_response, sobre
// UserThemeOverride, só header/footer). LoginPage.vue não foi alterado
// (mantém a sua própria cópia) para não arriscar a página de login já
// em produção.
//
// Isto é uma arquitectura PARALELA e mais antiga que ThemeSurface
// (ver ../theme/surfaceToStyle.js) - continua a ser o que
// layouts/MainLayout.vue e components/footer/MainFooter.vue usam de
// facto para o header/footer reais da app (via
// User.data.interface_config.header/footer), por isso não foi removido
// nem migrado aqui (CLAUDE.md secção 22: mudar o consumidor real da
// app é um refactor à parte, fora do que foi pedido para a pasta lib
// nesta ronda - ver relatório final). Não estender esta função nem
// criar novos usos do formato {type, value}; qualquer superfície nova
// deve usar theme.surfaces + ../theme/surfaceToStyle.js.

export function backgroundConfigToStyle(background, { fallbackColor } = {}) {
  if (!background) {
    return fallbackColor ? { backgroundColor: fallbackColor } : {}
  }

  const { type, value } = background

  if (type === 'transparent') {
    return { backgroundColor: 'transparent' }
  }

  if (type === 'image' && value) {
    return {
      backgroundImage: `url("${value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  if (type === 'gradient' && value) {
    return { background: value }
  }

  if (type === 'color' && value) {
    return { backgroundColor: value }
  }

  return fallbackColor ? { backgroundColor: fallbackColor } : {}
}

// { background: {...}, overlay, text_color } (InterfaceConfigService)
// -> style pronto a aplicar num elemento, incluindo a cor do texto e
// uma camada escura translúcida por cima de imagem/gradiente.
export function interfaceConfigToStyle(config, { fallbackColor } = {}) {
  if (!config) {
    return fallbackColor ? { backgroundColor: fallbackColor } : {}
  }

  const style = backgroundConfigToStyle(config.background, { fallbackColor })

  if (config.text_color) {
    style.color = config.text_color
  }

  return style
}

export function overlayStyle(overlay) {
  if (!overlay) return null

  return {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000000',
    opacity: overlay,
    pointerEvents: 'none',
  }
}
