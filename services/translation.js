import {useUserStore } from '../stores/UserStore'
import { getActivePinia } from 'pinia'
import {useLanguageStore } from '../stores/LanguageStore';




// function captura (texto = '') {
//   return texto.match(/\s*%-\s*[\w\s-]+\s*-%\s*/g) || []
// }

// function replaceTraducao (texto = '', textDeTraducao = '') {
//   const valores = captura(texto)
//   if (!valores.length) return textDeTraducao

//   let i = 0

//   return textDeTraducao.replace(
//     /\s*%-\s*[\w\s-]+\s*-%\s*/g,
//     () => {
//       const v = valores[i++]
//       return v
//         ? ' ' + v.replace('%-', '').replace('-%', '').trim() + ' '
//         : ''
//     }
//   )
// }

export const tdc = (texto = '') => {
  if (!getActivePinia()) return texto

  const store = useLanguageStore()
  const chave = texto?.toLowerCase()?.trim()

  return store.TraducaoMap[chave] || texto
}



// Keeps the capitalization of the original (simple)
function matchCase(original, transformed) {
  if (!original) return transformed
  // If original starts with an uppercase letter, capitalize
  if (original[0] === original[0].toUpperCase()) {
    return transformed[0].toUpperCase() + transformed.slice(1)
  }

  return transformed
}

export function toPlural(word, count = 2) {
  const User = useUserStore()
  const lang = User.Language.code
  const w = String(word || '').trim()
  if (!w) return ''

  // if 0/1 -> singular
  if (Number(count) === 1) return w

  const lower = w.toLowerCase()

  // 🔥 Irregulars (feel free to grow this over time)
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
  // 🇵🇹 PORTUGUESE (common rules)
  // =========================
  if (lang === 'pt-pt') {
    // already ends in s/x/z? often invariable in the plural (lápis, tórax, juiz->juízes is an exception)
    // as a safe general rule: if it ends in "s" or "x", keep it
    if (/[sx]$/i.test(w)) return w

    // ends in "m" => "ns" (homem->homens)
    if (/m$/i.test(w)) return w.replace(/m$/i, 'ns')

    // ends in "r" or "z" => +es (flor->flores, luz->luzes [already covered by +es, but luz usually takes +es])
    if (/[rz]$/i.test(w)) return w + 'es'

    // ends in "l" => "is" (papel->papeis) (there are accented exceptions we don't handle here)
    if (/l$/i.test(w)) return w.replace(/l$/i, 'is')

    // ends in "ão" => "ões" (most common pattern; exceptions go in the dictionary)
    if (/ão$/i.test(w)) return w.replace(/ão$/i, 'ões')

    // default: +s
    return w + 's'
  }

  // =========================
  // 🇬🇧 ENGLISH (common rules)
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