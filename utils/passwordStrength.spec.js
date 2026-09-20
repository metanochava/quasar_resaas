import { describe, it, expect } from 'vitest'

import { passwordStrength } from './passwordStrength'
import { maskEmail, maskPhone, maskContact } from './maskContact'

describe('passwordStrength - a visual aid only', () => {
  it('nothing typed is very weak with an empty bar', () => {
    expect(passwordStrength('')).toEqual({ score: 0, level: 'Very weak', percent: 0 })
  })

  it.each([
    ['short', 0],
    ['password1234', 0],
    ['aaaaaaaaaaaa', 0]
  ])('%s is at most weak', (value) => {
    expect(passwordStrength(value).score).toBeLessThanOrEqual(1)
  })

  it('longer and more varied is stronger', () => {
    const weak = passwordStrength('abcdefgh').score
    const fair = passwordStrength('Abcdefgh12').score
    const strong = passwordStrength('Tr0ub4dor&3-horse-battery').score

    expect(fair).toBeGreaterThanOrEqual(weak)
    expect(strong).toBeGreaterThan(fair)
    expect(strong).toBe(4)
  })

  it('is always within 0-4 and the percent follows the score', () => {
    for (const value of ['', 'a', 'abcdefgh', 'Abcdefgh1!', 'x'.repeat(40), 'Zx9$Zx9$Zx9$Zx9$Zx9$']) {
      const { score, percent } = passwordStrength(value)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(4)
      expect(percent).toBe(value ? (score + 1) * 20 : 0)
    }
  })
})

describe('maskContact', () => {
  it('hides most of an e-mail but keeps the domain', () => {
    expect(maskEmail('dias@mytech.co.mz')).toBe('di••@mytech.co.mz')
    expect(maskEmail('joao.manuel@example.com')).toMatch(/^jo•+@example\.com$/)
    expect(maskEmail('invalid')).toBe('')
  })

  it('hides most of a phone number', () => {
    expect(maskPhone('+258841234567')).toBe('+258 84 ••• ••••')
    expect(maskPhone('')).toBe('')
  })

  it('picks the right mask for the channel', () => {
    expect(maskContact('email', 'ab@x.com')).toContain('@x.com')
    expect(maskContact('mobile', '+258841234567')).toContain('•')
  })
})
