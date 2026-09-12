// Aplica a AnimationSetting efectiva globalmente.
//
// ATENÇÃO (gap de backend - ver CLAUDE.md secção 84): o modelo
// `AnimationSetting` é referenciado por User/Entity/EntityType
// (django_resaas.saas.models.user.py, entity.py, entity_type.py: FK
// 'django_resaas.AnimationSetting') e tem serializer próprio
// (data/layout_setting/serializers/layout_setting.py), mas a classe
// `AnimationSetting` em si já não existe em
// django_resaas/saas/models/layout_setting.py - só ficaram lá o import
// e o registo no admin. Isto é um problema do backend (fora da pasta
// lib) e não foi alterado aqui; esta função é por isso deliberadamente
// defensiva quanto aos campos que recebe, em vez de assumir uma forma
// que não se consegue confirmar no modelo actual.
export function applyAnimation(animation = {}) {
  const root = document.documentElement

  const speed =
    animation.animation_speed === 'fast'
      ? '0.2s'
      : animation.animation_speed === 'slow'
        ? '0.6s'
        : '0.35s'

  root.style.setProperty('--anim-speed', speed)
}
