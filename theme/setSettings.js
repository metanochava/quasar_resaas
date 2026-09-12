import { applyTheme } from './applyTheme.js'
import { applyLayout } from './applyLayout.js'
import { applyTypography } from './applyTypography.js'
import { applyAnimation } from './applyAnimation.js'

// Compõe os 4 aplicadores individuais - mantém a assinatura pública
// antiga (services/theme.js's setSettings) para não quebrar quem já a
// chama (ex.: stores/UserStore.js).
//
// Nota: o dark mode NÃO é decidido aqui. `LayoutSetting` não tem (nem
// nunca teve, ver django_resaas.saas.models.layout_setting.py) um
// campo `dark_mode` - é uma preferência pessoal guardada em
// localStorage por components/header/HeaderDarkMode.vue. A versão
// antiga desta função chamava `Dark.set(!!LayoutSettings.dark_mode)`,
// o que forçava sempre `Dark.set(false)` (o campo nunca existiu) e
// revertia silenciosamente a escolha do utilizador sempre que o tema
// era reaplicado (login, troca de Entity, Theme Studio...). Corrigido
// ao não tocar mais em Dark aqui.
export function setSettings(Theme, LayoutSettings, Typography, AnimationSettings) {
  applyTheme(Theme)
  applyLayout(LayoutSettings)
  applyTypography(Typography)
  applyAnimation(AnimationSettings)
}
