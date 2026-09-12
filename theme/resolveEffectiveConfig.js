// Resolução genérica da hierarquia de configuração visual:
//
//   User > Entity > EntityType
//
// Um valor `null`/vazio num nível significa "herdar" do nível
// seguinte - ver django_resaas.saas.models.user.User.get_effective_theme
// /get_effective_layout/get_effective_typography/get_effective_animation
// e get_ui_sources(), cuja lógica esta função espelha no frontend para
// que o Theme Studio (e qualquer outro consumidor) não tenha de
// duplicar a cadeia de herança em vários componentes.

const FIELDS = {
  theme: 'theme',
  layout: 'layout_settings',
  typography: 'typography',
  animation: 'animation_settings',
}

function idOf(value) {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'object') {
    return value.id ?? value.pk ?? value.value ?? null
  }

  return value
}

function objectOf(value) {
  return (value && typeof value === 'object') ? value : null
}

function resolveField(user, entity, entityType, fieldName) {
  const userValue = user?.[fieldName]

  if (idOf(userValue)) {
    return { id: idOf(userValue), object: objectOf(userValue), source: 'user' }
  }

  const entityValue = entity?.[fieldName]

  if (idOf(entityValue)) {
    return { id: idOf(entityValue), object: objectOf(entityValue), source: 'entity' }
  }

  const entityTypeValue = entityType?.[fieldName]

  if (idOf(entityTypeValue)) {
    return { id: idOf(entityTypeValue), object: objectOf(entityTypeValue), source: 'entity_type' }
  }

  return { id: null, object: null, source: null }
}

// resolveEffectiveConfig({ user, entity, entityType }) -> {
//   theme, layout, typography, animation,
//   ids: { theme, layout, typography, animation },
//   sources: { theme, layout, typography, animation }
// }
//
// `theme`/`layout`/`typography`/`animation` só vêm preenchidos com o
// objecto completo quando o valor recebido já era um objecto (ex.:
// resposta do backend com a relação expandida) - quando é apenas um
// id, `ids.<campo>` fica disponível na mesma para quem só precisa do
// FK a enviar de volta ao gravar (ver secção 14 do CLAUDE.md: só se
// grava o override, nunca a configuração completa).
export function resolveEffectiveConfig({ user, entity, entityType } = {}) {
  const resolved = {}

  Object.entries(FIELDS).forEach(([outputKey, fieldName]) => {
    resolved[outputKey] = resolveField(user, entity, entityType, fieldName)
  })

  return {
    theme: resolved.theme.object,
    layout: resolved.layout.object,
    typography: resolved.typography.object,
    animation: resolved.animation.object,

    ids: {
      theme: resolved.theme.id,
      layout: resolved.layout.id,
      typography: resolved.typography.id,
      animation: resolved.animation.id,
    },

    sources: {
      theme: resolved.theme.source,
      layout: resolved.layout.source,
      typography: resolved.typography.source,
      animation: resolved.animation.source,
    },
  }
}

export { FIELDS as EFFECTIVE_CONFIG_FIELDS }
