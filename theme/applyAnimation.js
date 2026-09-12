import { unwrapChoice } from './unwrapChoice.js'

// Aplica a AnimationSetting efectiva globalmente.
//
// django_resaas.saas.models.animation_setting.AnimationSetting.
// animation_speed é um CharField com choices - unwrapChoice() trata
// tanto a forma serializada por DRF ({id, value, label}, ver
// data/layout_setting/serializers/layout_setting.py's
// AnimationSettingSerializer) como a forma simples devolvida por
// User.get_ui_config() (via AnimationSetting.to_dict()).
export function applyAnimation(animation = {}) {
  const root = document.documentElement
  const speed = unwrapChoice(animation.animation_speed)

  root.style.setProperty(
    '--anim-speed',
    speed === 'fast' ? '0.2s' : speed === 'slow' ? '0.6s' : '0.35s'
  )
}
