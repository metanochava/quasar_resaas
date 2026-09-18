import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createPinia, setActivePinia } from 'pinia'

import FileComponent from './FileComponent.vue'
import BtnComponent from './BtnComponent.vue'
import TooltipComponent from './TooltipComponent.vue'

// FileComponent.vue (s-file) is the ONE component every FileField/
// ImageField renders through, for ANY model (Person.photo, Document.
// arquivo, a future Entity.logo, ...) - guessComponent()/FieldComponent
// only ever pick it by field.type/field.ui, never by field name or
// model, so there is nothing model-specific left to unit test here:
// these tests exercise the mechanism itself (native picker wiring,
// v-model, preview, remove), not any one field.
//
// This file (and its sibling FieldComponent.spec.js) is the FIRST
// real component-mount test in this codebase - @vue/test-utils was
// already a devDependency but @vitejs/plugin-vue was never wired into
// vitest.config.js, so no .vue SFC could ever be mounted; every other
// existing spec only tests plain .js utils extracted for that reason.
// The click-to-native-picker wiring kept regressing across several
// rounds of "fixes" precisely because nothing ever exercised the real
// DOM/event mechanism - only that gap is filled here.
const globalMountOptions = {
  plugins: [[Quasar, {}]],
  components: {
    's-btn': BtnComponent,
    's-tooltip': TooltipComponent
  },
  stubs: {
    // Needs navigator.mediaDevices (not available in happy-dom) and is
    // only ever opened for an image field's "Use camera" menu item -
    // irrelevant to the native-picker/v-model/preview mechanics under
    // test here.
    CameraCaptureDialog: true
  }
}

function mountFile(props = {}, extraOptions = {}) {
  return mount(FileComponent, {
    props,
    global: globalMountOptions,
    ...extraOptions
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('FileComponent (s-file) - native picker wiring', () => {
  // The native picker opens because the real <input type="file"> is
  // stacked transparently on top of the visible button, so the
  // pointer/touch event that "clicks the button" actually lands on the
  // input itself. This deliberately avoids the two previous regression
  // classes: a JS .click() call on the input from inside a handler
  // (some browsers/webviews apply stricter "was this really
  // user-activated" heuristics to a programmatic .click() than to a
  // genuine click), and a <label for> wrapping the button (per the HTML
  // label activation-behaviour spec, a click on a nested interactive
  // element like <button> is handled by that element and never
  // forwarded to the labeled control - only non-interactive label
  // content forwards the click; happy-dom's simplified label-forwarding
  // model does not reflect this real-browser rule, which is exactly why
  // that approach kept passing here while failing for the user).
  it('stacks the real <input type="file"> directly on top of the Add button, not behind a <label>', () => {
    const wrapper = mountFile({ modelValue: null })

    const wrapperDiv = wrapper.find('.s-file-picker-btn')
    const input = wrapperDiv.find('input[type="file"]')

    expect(input.exists()).toBe(true)
    expect(input.attributes('id')).toBeTruthy()
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('each s-file instance gets its own unique input id (no collision between multiple fields on one page)', () => {
    const first = mountFile({ modelValue: null })
    const second = mountFile({ modelValue: null })

    const firstId = first.find('input[type="file"]').attributes('id')
    const secondId = second.find('input[type="file"]').attributes('id')

    expect(firstId).not.toBe(secondId)
  })

  it('an image field gets a separate "Use camera" button instead of a choice menu over the picker', () => {
    const wrapper = mountFile({ modelValue: null, accept: 'image/*' })

    // "Choose file" no longer exists as a menu item that needs its own
    // label - the Add button's overlay input above covers that case
    // directly. Camera capture is a distinct button with a plain click
    // handler, since it never touches the native file picker.
    expect(wrapper.find('.s-file-picker-btn input[type="file"]').exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'CameraCaptureDialog' }).length).toBeGreaterThan(0)
  })
})

describe('FileComponent (s-file) - v-model', () => {
  it('emits the picked File back out through v-model, unchanged', async () => {
    const wrapper = mountFile({ modelValue: null })
    const file = new File(['hello'], 'contract.pdf', { type: 'application/pdf' })
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')

    const emittedFile = wrapper.emitted('update:modelValue')[0][0]
    expect(emittedFile).toBeInstanceOf(File)
    expect(emittedFile.name).toBe('contract.pdf')
    expect(emittedFile.type).toBe('application/pdf')
  })

  it('shows a preview for the freshly picked File before it is ever saved', async () => {
    const wrapper = mountFile({ modelValue: null })
    const file = new File(['hello'], 'contract.pdf', { type: 'application/pdf' })

    await wrapper.setProps({ modelValue: file })

    expect(wrapper.text()).toContain('contract.pdf')
  })

  it('renders an already-uploaded backend file object as a preview, not as a broken "new File"', () => {
    const existing = { url: 'https://cdn.example.com/media/photo.jpg', name: 'photo.jpg', mime_type: 'image/jpeg' }
    const wrapper = mountFile({ modelValue: existing })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(existing.url)
  })

  it('removing the current value clears it back to null via v-model', async () => {
    const existing = { url: 'https://cdn.example.com/media/contract.pdf', name: 'contract.pdf', mime_type: 'application/pdf' }
    const wrapper = mountFile({ modelValue: existing })

    const buttons = wrapper.find('.s-file-preview-item').findAllComponents({ name: 's-btn' })
    await buttons.at(-1).trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe(null)
  })
})

describe('FileComponent (s-file) - image field affordances', () => {
  it('offers the camera option only when accept indicates an image field', () => {
    const withImageAccept = mountFile({ modelValue: null, accept: 'image/*' })
    expect(withImageAccept.findComponent({ name: 'CameraCaptureDialog' }).exists()).toBe(true)

    const withPlainFile = mountFile({ modelValue: null, accept: '*' })
    expect(withPlainFile.findComponent({ name: 'CameraCaptureDialog' }).exists()).toBe(false)
  })
})
