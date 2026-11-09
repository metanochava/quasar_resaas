import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import DateComponent from './DateComponent.vue'
import DateTimeComponent from './DateTimeComponent.vue'
import { useUserStore } from '../../stores/UserStore'

beforeEach(() => setActivePinia(createPinia()))

function mountWith (component, code, modelValue) {
  useUserStore().Language = { id: 1, code }
  return mount(component, { props: { modelValue }, global: { plugins: [[Quasar, {}]] } })
}

describe('s-date / s-date-time - the language order on screen, ISO in v-model', () => {
  it('pt-pt shows day/month/year, en-us month/day/year', () => {
    expect(mountWith(DateComponent, 'pt-pt', '2026-11-09').find('input').element.value).toBe('09/11/2026')
    expect(mountWith(DateComponent, 'en-us', '2026-11-09').find('input').element.value).toBe('11/09/2026')
  })

  it('a date typed in the language order is emitted as ISO', async () => {
    const w = mountWith(DateComponent, 'en-us', null)

    await w.find('input').setValue('11/09/2026')

    expect(w.emitted('update:modelValue').at(-1)).toEqual(['2026-11-09'])
  })

  it('date and time: shown 24h in the language order, emitted as "YYYY-MM-DD HH:mm:ss"', async () => {
    const w = mountWith(DateTimeComponent, 'pt-pt', '2026-11-09 14:30:00')
    expect(w.find('input').element.value).toBe('09/11/2026 14:30')

    await w.find('input').setValue('10/11/2026 08:05')

    expect(w.emitted('update:modelValue').at(-1)).toEqual(['2026-11-10 08:05:00'])
  })
})
