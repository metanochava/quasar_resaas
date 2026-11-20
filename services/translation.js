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
  const traducao = store.TraducaoMap[chave]

  if (!traducao) return texto

  // keys are matched without case ("Exam request result" finds the
  // "exam request result" row): a text that starts with a capital gets a
  // translation that starts with one too ("Resultado de pedido de exame")
  return capitalizeLike(String(texto).trim(), traducao)
}

export function capitalizeLike (original, translation) {
  const first = original?.[0]
  if (!first || !translation || typeof translation !== 'string') return translation
  const isCapital = first !== first.toLowerCase() && first === first.toUpperCase()
  return isCapital ? translation[0].toUpperCase() + translation.slice(1) : translation
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

// The plural a menu shows for its label (SubMenu). A label that already is a
// plural stays as it is: "Sales", "Purchase orders", "Vendas" - the menus
// carry plural labels too ("Saless" was the old blind "+s"). The rules follow
// the language family (pt-pt -> pt, en-us -> en; "en-en" never matched).
export function toPlural(word, count = 2) {
  const User = useUserStore()
  const family = String(User.Language?.code || '').toLowerCase().split('-')[0]
  const w = String(word || '').trim()
  if (!w) return ''

  // if 0/1 -> singular
  if (Number(count) === 1) return w

  // only the last word changes ("Purchase order" -> "Purchase orders")
  const parts = w.split(/(\s+)/)
  const last = parts[parts.length - 1]
  const lower = last.toLowerCase()

  const irregular = {
    pt: { 'mão': 'mãos', 'cão': 'cães', 'pão': 'pães', 'país': 'países', 'luz': 'luzes', 'cidadão': 'cidadãos', 'alemão': 'alemães' },
    en: { person: 'people', man: 'men', woman: 'women', child: 'children', mouse: 'mice', goose: 'geese', tooth: 'teeth', foot: 'feet' }
  }
  const plurals = new Set(Object.values(irregular[family] || {}))
  const done = (plural) => [...parts.slice(0, -1), plural].join('')

  if (plurals.has(lower)) return w
  const irr = irregular[family]?.[lower]
  if (irr) return done(matchCase(last, irr))

  if (family === 'pt') {
    // a label of several words is the translator's ("Ordem de compra" ->
    // "Ordens de compra" changes the first word, "Conta aberta" both): as written
    if (parts.length > 1) return w
    // already ends in s/x: a plural, or invariable (lápis, tórax)
    if (/[sx]$/i.test(last)) return w
    if (/m$/i.test(last)) return done(last.replace(/m$/i, 'ns'))      // homem -> homens
    if (/[rz]$/i.test(last)) return done(last + 'es')                  // flor -> flores
    if (/ão$/i.test(last)) return done(last.replace(/ão$/i, 'ões'))   // ação -> ações
    if (/l$/i.test(last)) return done(last.replace(/l$/i, 'is'))      // papel -> papeis
    return done(last + 's')
  }

  // English (and any other language)
  // already a plural: "sales", "orders", "categories" (not "class", "status")
  if (/[^su]s$/i.test(last) || /ies$/i.test(last)) return w
  if (/[^aeiou]y$/i.test(last)) return done(last.replace(/y$/i, 'ies'))   // city -> cities
  if (/(s|sh|ch|x|z)$/i.test(last)) return done(last + 'es')              // branch -> branches
  return done(last + 's')
}
