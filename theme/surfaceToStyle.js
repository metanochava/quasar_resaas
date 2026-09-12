// Converte um ThemeSurface (django_resaas.saas.models.theme_surface.
// ThemeSurface.to_dict()) num style Vue pronto a aplicar - substitui a
// antiga dependência directa de entity.header_background_type /
// entity.footer_background_type / entity.login_background_type (ver
// CLAUDE.md secção 5/21): a nova origem é sempre theme.surfaces[area].
//
// Campos suportados (iguais aos do modelo):
//   background_type: transparent | color | gradient | image
//   background_color, background_gradient, background_image
//   background_opacity, background_overlay
//   background_size, background_position, background_repeat
//   backdrop_blur

export function surfaceToStyle(surface) {
  if (!surface) return {}

  const style = {}
  const type = surface.background_type

  if (type === 'transparent') {
    style.background = 'transparent'
  } else if (type === 'color') {
    style.background = surface.background_color || surface.background_value || 'transparent'
  } else if (type === 'gradient') {
    style.background = surface.background_gradient || surface.background_value || 'transparent'
  } else if (type === 'image') {
    const image = surface.background_image || surface.background_value

    if (image) {
      style.backgroundImage = `url("${image}")`
    }

    style.backgroundSize = surface.background_size || 'cover'
    style.backgroundPosition = surface.background_position || 'center'
    style.backgroundRepeat = surface.background_repeat ? 'repeat' : 'no-repeat'
  }

  if (surface.background_opacity !== undefined && surface.background_opacity !== null) {
    style.opacity = surface.background_opacity
  }

  if (surface.backdrop_blur) {
    style.backdropFilter = `blur(${surface.backdrop_blur}px)`
    style.WebkitBackdropFilter = `blur(${surface.backdrop_blur}px)`
  }

  return style
}

// Camada escura translúcida por cima de uma superfície com imagem/
// gradiente (background_overlay, 0-1) - a devolver como elemento
// absoluto separado, já que `opacity` no próprio fundo desvaneceria
// também o conteúdo em cima.
export function surfaceOverlayStyle(surface) {
  if (!surface?.background_overlay) return null

  return {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000000',
    opacity: surface.background_overlay,
    pointerEvents: 'none',
  }
}

// area -> ícone Material sugerido (usado em listas/badges de superfícies).
const SURFACE_ICONS = {
  login: 'login',
  layout: 'dashboard',
  page: 'web',
  header: 'web_asset',
  footer: 'vertical_align_bottom',
  sidebar: 'view_sidebar',
  drawer: 'menu_open',
  toolbar: 'construction',
  card: 'crop_square',
  dialog: 'open_in_new',
}

export function surfaceIcon(area) {
  return SURFACE_ICONS[area] || 'palette'
}

export function surfacesToMap(surfaces) {
  if (Array.isArray(surfaces)) {
    return Object.fromEntries(surfaces.map(s => [s.area, s]))
  }

  if (surfaces && typeof surfaces === 'object') {
    return surfaces
  }

  return {}
}

export function surfacesToList(surfaces) {
  if (Array.isArray(surfaces)) return surfaces

  if (surfaces && typeof surfaces === 'object') {
    return Object.values(surfaces)
  }

  return []
}
