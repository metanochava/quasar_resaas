
import { Dark, setCssVar } from "quasar"



function normalizeTheme(theme = {}) {

  const ignore = [
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
    'state',
    'name',
    'created_by',
    'updated_by'
  ]

  const cleanTheme = {}

  Object.entries(theme).forEach(([key, value]) => {

    if (
      !ignore.includes(key) &&
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      cleanTheme[key] = value
    }

  })

  return cleanTheme
}


export function setSettings(Theme, LayoutSettings, Typography, AnimationSettings){


  /* =========================
    🌙 DARK MODE
  ========================= */

  Dark.set(!!LayoutSettings.dark_mode)

  /* =========================
    🎨 CORES (QUASAR)
  ========================= */

  const theme = normalizeTheme(Theme)

  Object.entries(theme).forEach(([key, value]) => {
    setCssVar(key, value)
  })

  /* =========================
    🎨 CSS VARIABLES (GLOBAL SYSTEM)
  ========================= */

  const root = document.documentElement

  // 👉 BORDER RADIUS (🔥 AQUI ESTÁ O QUE FALTAVA)
  let radius = "4px"


  if (LayoutSettings.border_radius) {
    radius = LayoutSettings.border_radius
  }

  if (LayoutSettings.rounded) {
    radius = "16px"
  }

  if (LayoutSettings.square) {
    radius = "0px"
  }

  root.style.setProperty("--s-radius", radius)

  // 👉 INPUT COLORS
  root.style.setProperty("--input-bg", Theme.input_background || "#f6d7d7ff")
  root.style.setProperty("--input-border", Theme.input_border || "#ccc")
  root.style.setProperty("--input-focus", Theme.input_focus || "#1976D2")

  // 👉 BUTTON COLORS
  root.style.setProperty("--btn-primary", Theme.button_primary)
  root.style.setProperty("--btn-primary-text", Theme.button_primary_text)

  // 👉 TEXT
  root.style.setProperty("--text-primary", Theme.text_primary)
  root.style.setProperty("--text-secondary", Theme.text_secondary)

  /* =========================
    🧱 BACKGROUND GLOBAL
  ========================= */

  document.body.style.background =
    Dark.isActive
      ? (Theme.background_dark || Theme.background || '')
      : (Theme.background || Theme.background_dark || '')

  /* =========================
    🔤 TIPOGRAFIA
  ========================= */

  const font = Typography?.font_family?.label || "Roboto"

  let link = document.getElementById("dynamic-theme-font")

  const fontHref = `https://fonts.googleapis.com/css2?family=${font?.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`

  if (!link) {
    link = document.createElement("link")
    link.id = "dynamic-theme-font"
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }

  if (link.href !== fontHref) {
    link.href = fontHref
  }

  document.body.style.fontFamily = font

  if (Typography.font_size_base) {
    document.body.style.fontSize = `${Typography.font_size_base}px`
  }

  if (Typography.line_height) {
    document.body.style.lineHeight = Typography.line_height
  }

  /* =========================
    ⚡ ANIMAÇÃO
  ========================= */

  const speed =
    AnimationSettings.animation_speed === "fast"
      ? "0.2s"
      : AnimationSettings.animation_speed === "slow"
      ? "0.6s"
      : "0.35s"

  root.style.setProperty("--anim-speed", speed)

  console.log("✅ Theme applied (GLOBAL ENGINE)")
}
