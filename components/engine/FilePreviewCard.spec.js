import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import FilePreviewCard from './FilePreviewCard.vue'

const stubs = {
  's-modal-card': { template: '<div class="card"><slot name="bar-actions" /><slot /></div>' },
  's-btn': { template: '<button><slot /></button>' },
  's-tooltip': { template: '<span><slot /></span>' },
  's-card': { template: '<div class="s-card" @click="$emit(\'click\')"><slot /></div>' },
  'q-dialog': { props: ['modelValue'], template: '<div v-if="modelValue" class="dlg"><slot /></div>' },
}

// the preview the lab results use, shared with the documents' files
describe('FilePreviewCard (s-file-preview)', () => {
  it('shows a thumbnail and opens the file full screen on a click', async () => {
    const file = { id: 'f1', name: 'frente.png', arquivo: { url: 'http://x/f.png', mime_type: 'image/png' } }
    const wrapper = mount(FilePreviewCard, { props: { file }, slots: { actions: '<i class="act" />' }, global: { plugins: [Quasar], stubs } })

    expect(wrapper.find('[data-test="file-preview-thumb-image"] img').exists()).toBe(true)
    expect(wrapper.find('.act').exists()).toBe(true)
    expect(wrapper.find('[data-test="file-viewer"]').exists()).toBe(false)

    await wrapper.find('[data-test="file-preview-file"]').trigger('click')

    expect(wrapper.find('[data-test="file-preview-image"] img').exists()).toBe(true)
  })

  it('without a file shows the empty slot', () => {
    const wrapper = mount(FilePreviewCard, { props: { file: { arquivo: null } }, slots: { empty: '<p class="none">-</p>' }, global: { plugins: [Quasar], stubs } })
    expect(wrapper.find('.none').exists()).toBe(true)
  })
})
