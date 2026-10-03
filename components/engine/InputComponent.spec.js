import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import InputComponent from './InputComponent.vue'

beforeEach(() => setActivePinia(createPinia()))

const mountInput = (props = {}, slots = {}) =>
  mount(InputComponent, { props: { modelValue: '', ...props }, slots, global: { plugins: [[Quasar, {}]] } })

describe('s-input - slots', () => {
  it('passes the caller\'s append slot to q-input (e.g. a button inside the field)', () => {
    const w = mountInput({}, { append: '<button data-test="inside">+</button>' })

    expect(w.find('.q-field__append [data-test="inside"]').exists()).toBe(true)
  })

  it('passes prepend, before and after too', () => {
    const w = mountInput({}, {
      prepend: '<i data-test="p" />', before: '<i data-test="b" />', after: '<i data-test="a" />',
    })

    expect(w.find('.q-field__prepend [data-test="p"]').exists()).toBe(true)
    expect(w.find('.q-field__before [data-test="b"]').exists()).toBe(true)
    expect(w.find('.q-field__after [data-test="a"]').exists()).toBe(true)
  })

  it('type="search" shows a search icon in prepend', () => {
    expect(mountInput({ type: 'search' }).find('.q-field__prepend .q-icon').text()).toBe('search')
  })

  it('a caller prepend replaces the search icon', () => {
    const w = mountInput({ type: 'search' }, { prepend: '<i data-test="mine" />' })

    expect(w.find('.q-field__prepend [data-test="mine"]').exists()).toBe(true)
    expect(w.find('.q-field__prepend .q-icon').exists()).toBe(false)
  })

  it('keeps its own password toggle when the caller gives no append', () => {
    expect(mountInput({ type: 'password' }).find('.q-field__append .q-icon').text()).toBe('visibility')
  })

  it('a caller append replaces the built-in one instead of rendering both', () => {
    const w = mountInput({ type: 'password' }, { append: '<i data-test="mine" />' })

    expect(w.find('.q-field__append [data-test="mine"]').exists()).toBe(true)
    expect(w.find('.q-field__append .q-icon').exists()).toBe(false)
  })
})
