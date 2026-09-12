// Aplica os aspectos do LayoutSetting que afectam CSS global (estrutura,
// não cor - ver CLAUDE.md secção 8: "não colocar cores/backgrounds em
// LayoutSetting").
//
// django_resaas.saas.models.layout_setting.LayoutSetting só expõe hoje
// `rounded`/`dense` como booleanos de estilo global (ver to_dict()) -
// os antigos `border_radius`/`square` não existem no modelo actual e
// foram removidos daqui (CLAUDE.md secção 8: "se já não existirem,
// remover as referências antigas do frontend").
export function applyLayout(layout = {}) {
  const root = document.documentElement

  root.style.setProperty('--s-radius', layout.rounded ? '16px' : '4px')
}
