import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { token: 'tok' } }) }))
vi.mock('../../services/translation', () => ({ tdc: t => t }))
vi.mock('../../services/api', () => ({ HTTPClient: { get: vi.fn() }, url: ({ url }) => url }))

import { HTTPClient } from '../../services/api'
import Page from './PrintVerifyPage.vue'

const mountPage = () => mount(Page, { global: { plugins: [Quasar], stubs: { 's-card': { template: '<div><slot /></div>' }, 'q-page': { template: '<div><slot /></div>' } } } })

// braces: mockReset() returns the mock, and a function returned by beforeEach
// is run as the test's teardown (it called the rejecting mock once more)
beforeEach(() => { HTTPClient.get.mockReset() })

describe('/v/:token - a printed document\'s QR code', () => {
  it('an authentic document shows its public fields, without an error toast', async () => {
    HTTPClient.get.mockResolvedValue({ data: { voided: false, document: 'Receipt', entity: 'Tsakane', branch: 'Mahubo',
      fields: [{ label: 'Receipt', value: '668DEBD8' }, { label: 'Total', value: '80.00' }] } })
    const w = mountPage()
    await flushPromises()

    expect(HTTPClient.get).toHaveBeenCalledWith('printing/verify/tok/', { silent: true })
    expect(w.find('[data-test="print-verify-title"]').text()).toBe('Authentic document')
    expect(w.findAll('[data-test="print-verify-field"]')).toHaveLength(2)
  })

  it('a voided document says so', async () => {
    HTTPClient.get.mockResolvedValue({ data: { voided: true, document: 'Receipt', fields: [] } })
    const w = mountPage()
    await flushPromises()

    expect(w.find('[data-test="print-verify-title"]').text()).toBe('Voided document')
  })

  it('a token that is not ours: not recognised', async () => {
    HTTPClient.get.mockRejectedValue(Object.assign(new Error('not ours'), { response: { status: 404 } }))
    const w = mountPage()
    await flushPromises()

    expect(w.find('[data-test="print-verify-unknown"]').exists()).toBe(true)
  })
})
