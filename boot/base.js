
import { getActivePinia } from 'pinia'
import {useUserStore } from '../stores/UserStore'
import {useLanguageStore } from '../stores/LanguageStore';
import figlet from 'figlet'
import { Dark, setCssVar } from "quasar"

export const tdc = (texto = '') => {
  if (!getActivePinia()) return texto

  const store = useLanguageStore()
  const chave = texto?.toLowerCase()?.trim()

  return store.TraducaoMap[chave] || texto
}


function captura (texto = '') {
  return texto.match(/\s*%-\s*[\w\s-]+\s*-%\s*/g) || []
}

function replaceTraducao (texto = '', textDeTraducao = '') {
  const valores = captura(texto)
  if (!valores.length) return textDeTraducao

  let i = 0

  return textDeTraducao.replace(
    /\s*%-\s*[\w\s-]+\s*-%\s*/g,
    () => {
      const v = valores[i++]
      return v
        ? ' ' + v.replace('%-', '').replace('-%', '').trim() + ' '
        : ''
    }
  )
}

// Initialize the annoying-background directive.
export const IsTipoEntidade = {
  bind (el, binding, _vnode) {
    if (el) {
      const ite = decrypt(localStorage.getItem(('tipo_entidade_nome')) + '')

      if (!(binding.value === ite)) {
        el.style.display = 'none'
      }
    }
  }
}

export const JSONSafeParse = function (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export const isTipoEntidadeMe = function (x) {
  const ite = decrypt(localStorage.getItem(('tipo_entidade_nome')) + '')
  if (x === ite) { return true } else { return false }
}


export const perfilSplint = (txt) => {
  if (!txt) return null
  const p = txt.split('_')
  return p[1] ?? p[0]
}
export const urlBase = (url = '') => {
  if (url === '') {
    return process.env.API
  }

  if (url != null) {
    if (url[0] === '/') {
      return process.env.API + url
    }
    if (url[0] === 'h') {
      return url
    }
  }
}

function base64url (source) {
  const CryptoJS = require('crypto-js')
  // Encode in classical base64
  let encodedSource = CryptoJS.enc.Base64.stringify(source)

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '')

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-')
  encodedSource = encodedSource.replace(/\//g, '_')

  return encodedSource
}


export const pegaDominio = function () {
  let pagelocalurl = location.href // pega endereço que esta no navegador
  pagelocalurl = pagelocalurl.split('/') // quebra o endeço de acordo com a / (barra)
  const dominiourl = pagelocalurl[0] + '//' + pagelocalurl[2]
  return dominiourl // retorna a parte www.endereco.com.brs@
}


export const createToken = (data, secret = 'se') => {
  // const base64url = require('base64url');
  const CryptoJS = require('crypto-js')
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header))
  const encodedHeader = base64url(stringifiedHeader)

  const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data))
  const encodedData = base64url(stringifiedData)

  const token = encodedHeader + '.' + encodedData

  let signature = CryptoJS.HmacSHA256(token, secret)
  signature = base64url(signature)

  const signedToken = token + '.' + signature

  return signedToken
}


export function ascii(text, font = 'Standard') {
  return figlet.textSync(text, { font })
}



export function toPlural(word, count = 2) {
  const User = useUserStore()
  const lang = User.Idioma.code
  const w = String(word || '').trim()
  if (!w) return ''

  // se for 0/1 -> singular
  if (Number(count) === 1) return w

  const lower = w.toLowerCase()

  // 🔥 Irregulares (podes crescer isso ao longo do tempo)
  const irregular = {
    pt: {
      'mão': 'mãos',
      'cão': 'cães',
      'pão': 'pães',
      'país': 'países',
      'luz': 'luzes',
      'cidadão': 'cidadãos',
      'alemão': 'alemães',
    },
    en: {
      'person': 'people',
      'man': 'men',
      'woman': 'women',
      'child': 'children',
      'mouse': 'mice',
      'goose': 'geese',
      'tooth': 'teeth',
      'foot': 'feet',
    }
  }

  const irr = irregular[lang]?.[lower]
  if (irr) return matchCase(w, irr)

  // =========================
  // 🇵🇹 PORTUGUÊS (regras comuns)
  // =========================
  if (lang === 'pt-pt') {
    // já termina em s/x/z? muitas vezes é invariável no plural (lápis, tórax, juiz->juízes é exceção)
    // Como regra geral segura: se termina em "s" ou "x", mantém
    if (/[sx]$/i.test(w)) return w

    // termina em "m" => "ns" (homem->homens)
    if (/m$/i.test(w)) return w.replace(/m$/i, 'ns')

    // termina em "r" ou "z" => +es (flor->flores, luz->luzes [já cobre com +es, mas luz costuma +es])
    if (/[rz]$/i.test(w)) return w + 'es'

    // termina em "l" => "is" (papel->papeis) (há acentos que não tratamos aqui)
    if (/l$/i.test(w)) return w.replace(/l$/i, 'is')

    // termina em "ão" => "ões" (padrão mais comum; exceções vão no dicionário)
    if (/ão$/i.test(w)) return w.replace(/ão$/i, 'ões')

    // default: +s
    return w + 's'
  }

  // =========================
  // 🇬🇧 INGLÊS (regras comuns)
  // =========================
  if (lang === 'en-en') {
    // city -> cities
    if (/[^aeiou]y$/i.test(w)) return w.replace(/y$/i, 'ies')

    // box, church, class -> +es
    if (/(s|sh|ch|x|z)$/i.test(w)) return w + 'es'

    // default
    return w + 's'
  }

  // =========================
  // 🌍 fallback
  // =========================
  return w + 's'
}

// Mantém a capitalização do original (simples)
function matchCase(original, transformed) {
  if (!original) return transformed
  // Se original começa com Maiúscula, capitaliza
  if (original[0] === original[0].toUpperCase()) {
    return transformed[0].toUpperCase() + transformed.slice(1)
  }
  return transformed
}

export function guessLabelKey(obj) {
  // tenta achar um campo “humano” pra label
  const candidates = ['label','nome', 'name', 'titulo', 'title', 'descricao', 'description', 'username', 'email']
  for (const k of candidates) if (obj && obj[k]) return k
  return 'id'
}

export function resolveRoute(item, add) {
  if (!item) return null

  if (item.crud) {
    return {
      name: 'crud_route',
      params: item.crud || {},
    }
  }
  if(add==0){
    if (item.rota) {
      return {
        name: item.rota,
      }
    }
  }
  if(add==1){

    if (item.add_rota) {
      return {
        name: item.add_rota,
      }
    }
  }

  return null
}


function normalizeTheme(theme = {}) {

  const ignore = [
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
    'estado',
    'nome',
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

  const font = Typography.font_family || "Roboto"

  let link = document.getElementById("dynamic-theme-font")

  const fontHref =
    `https://fonts.googleapis.com/css2?family=${font?.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`

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

  console.log("✅ Theme aplicado (GLOBAL ENGINE)")
}
