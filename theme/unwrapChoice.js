// Um CharField com `choices` (ex.: AnimationSetting.button_animation,
// Typography.font_family) vem em forma diferente consoante o caminho
// que o devolveu:
//
// - Via um serializer DRF normal (RepresentationMixin no backend -
//   django_resaas.saas.core.base.mixins.serializer.representation) ->
//   {id, value, label} (usado por themeGet/typographyGet/
//   animationSettingsGet em EntityTypeStore/EntityStore).
//
// - Via o próprio to_dict() do modelo (User.get_ui_config(), usado por
//   /api/me/'s ui_config) -> string simples, sem wrapping.
//
// unwrapChoice() normaliza qualquer uma das duas formas para a string
// simples, para nunca comparar `=== 'ripple'` contra um objecto por
// engano.
export function unwrapChoice(value) {
  if (value && typeof value === 'object') {
    return value.value ?? value.id ?? null
  }

  return value ?? null
}
