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



// Mantém a capitalização do original (simples)
function matchCase(original, transformed) {
  if (!original) return transformed
  // Se original começa com Maiúscula, capitaliza
  if (original[0] === original[0].toUpperCase()) {
    return transformed[0].toUpperCase() + transformed.slice(1)
  }sh
  
  return transformed
}

export function toPlural(word, count = 2) {
  const User = useUserStore()
  const lang = User.Language.code
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