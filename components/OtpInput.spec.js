import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'

import OtpInput from './OtpInput.vue'

const mountOtp = () => mount(OtpInput, { props: { length: 6 }, global: { plugins: [[Quasar, {}]] }, attachTo: document.body })

const type = async (wrapper, code) => {
  const boxes = wrapper.findAll('input.otp-box')
  for (const [i, digit] of [...code].entries()) {
    boxes[i].element.value = digit
    await boxes[i].trigger('input')
  }
}

describe('OtpInput', () => {
  it('emits complete once - and only when every box is filled', async () => {
    const wrapper = mountOtp()

    await type(wrapper, '12345')
    expect(wrapper.emitted('complete')).toBeUndefined()

    await type(wrapper, '123456')
    expect(wrapper.emitted('complete')).toEqual([['123456']])
  })

  it('v-model is the digits typed so far', async () => {
    const wrapper = mountOtp()

    await type(wrapper, '123')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['123'])
  })

  it('pasting a full code fills every box and completes', async () => {
    const wrapper = mountOtp()

    await wrapper.find('input.otp-box').trigger('paste', { clipboardData: { getData: () => '482 913' } })

    expect(wrapper.emitted('complete')).toEqual([['482913']])
  })
})
