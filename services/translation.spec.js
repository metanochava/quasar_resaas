import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// tdc() matches keys without case; a capitalised text keeps its capital in
// the translation ("Exam request result" -> "Resultado de pedido de exame")
const map = { 'exam request result': 'resultado de pedido de exame', save: 'Gravar' }

vi.mock('../stores/LanguageStore', () => ({ useLanguageStore: () => ({ TraducaoMap: map }) }))
vi.mock('../stores/UserStore', () => ({ useUserStore: () => ({ Language: { code: 'pt-pt' } }) }))

import { tdc, capitalizeLike } from './translation'

beforeEach(() => setActivePinia(createPinia()))

describe('tdc() capitalisation', () => {
  it('capitalises the translation of a capitalised text', () => {
    expect(tdc('Exam request result')).toBe('Resultado de pedido de exame')
  })

  it('keeps a lower-case translation for a lower-case text (mid-sentence)', () => {
    expect(tdc('exam request result')).toBe('resultado de pedido de exame')
  })

  it('never lowers a translation that is already capitalised', () => {
    expect(tdc('save')).toBe('Gravar')
  })

  it('returns the text itself when there is no translation', () => {
    expect(tdc('Unknown text')).toBe('Unknown text')
  })

  it('capitalizeLike ignores texts that do not start with a letter', () => {
    expect(capitalizeLike('1 item', 'um item')).toBe('um item')
  })
})
