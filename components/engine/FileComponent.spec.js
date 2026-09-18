import { describe, it, expect, beforeEach, vi } from 'vitest'
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
  it('clicking Add calls .click() on the real underlying <input type="file">, synchronously', async () => {
    const wrapper = mountFile({ modelValue: null })

    const input = wrapper.find('input[type="file"]')
    expect(input.exists()).toBe(true)

    const clickSpy = vi.spyOn(input.element, 'click')

    // Plain (non-image) field - never shows the choose-file/use-camera
    // menu, so the Add button calls openAdd() directly.
    await wrapper.find('.s-file button').trigger('click')

    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('never defers the native-picker trigger through a microtask (regression guard)', () => {
    const wrapper = mountFile({ modelValue: null })
    const input = wrapper.find('input[type="file"]')

    let calledSynchronously = false
    const nativeClick = input.element.click.bind(input.element)
    input.element.click = () => {
      calledSynchronously = true
      return nativeClick()
    }

    wrapper.find('.s-file button').element.dispatchEvent(new Event('click', { bubbles: true }))

    // No await/microtask boundary between dispatch and this assertion -
    // if openAdd() ever goes back to nextTick()/Promise-deferring the
    // click(), this observes it still being false here.
    expect(calledSynchronously).toBe(true)
  })

  it('opening the picker through the image field\'s "Choose file" menu item is still synchronous', async () => {
    // QMenu teleports its content to document.body - attachTo makes
    // that teleported markup queryable from the real document instead
    // of only the wrapper's own (detached) root subtree.
    const wrapper = mountFile({ modelValue: null, accept: 'image/*' }, { attachTo: document.body })
    const input = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(input.element, 'click')

    // Open the menu, then click "Choose file" inside it - the second,
    // separate click is what actually must stay synchronous.
    await wrapper.find('.s-file button').trigger('click')

    const chooseFileItem = Array.from(document.body.querySelectorAll('.q-item'))
      .find(el => el.textContent.includes('Choose file'))
    expect(chooseFileItem).toBeTruthy()

    chooseFileItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(clickSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
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
