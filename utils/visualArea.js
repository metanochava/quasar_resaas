// Converte um "background config" resolvido pelo backend
// ({type: 'color'|'gradient'|'image'|'transparent', value}) num
// objecto de style Vue - mesma lógica já usada por
// pages/auth/LoginPage.vue's loginBackgroundStyle(), generalizada
// para reutilização em header/footer (ver InterfaceConfigService no
// backend). LoginPage.vue não foi alterado (mantém a sua própria
// cópia) para não arriscar a página de login já em produção.

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
