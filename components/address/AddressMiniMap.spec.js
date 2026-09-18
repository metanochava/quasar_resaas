import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const hasKey = vi.fn()
const loadMaps = vi.fn()

vi.mock('../../services/googleMaps', () => ({
  hasGoogleMapsKey: () => hasKey(),
  loadGoogleMaps: () => loadMaps()
}))

import AddressMiniMap from './AddressMiniMap.vue'

const address = { latitude: '-25.965500', longitude: '32.583200' }

beforeEach(() => {
  hasKey.mockReset()
  loadMaps.mockReset()
  delete window.google
})

describe('AddressMiniMap', () => {
  it('renders nothing without coordinates', () => {
    hasKey.mockReturnValue(false)
    expect(mount(AddressMiniMap, { props: { address: null } }).html()).toBe('<!--v-if-->')
    expect(mount(AddressMiniMap, { props: { address: { latitude: null, longitude: null } } }).find('iframe').exists()).toBe(false)
  })

  it('without a Google key shows a keyless OpenStreetMap embed centred on the point', () => {
    hasKey.mockReturnValue(false)
    const src = mount(AddressMiniMap, { props: { address } }).find('iframe').attributes('src')

    expect(src).toContain('openstreetmap.org/export/embed.html')
    expect(src).toContain('marker=-25.9655,32.5832')
  })

  it('with a Google key draws a map and marker at the (string) coordinates', async () => {
    hasKey.mockReturnValue(true)
    loadMaps.mockResolvedValue()
    const Map = vi.fn()
    const Marker = vi.fn()
    window.google = { maps: { Map, Marker } }

    const wrapper = mount(AddressMiniMap, { props: { address, label: 'Ana' }, attachTo: document.body })
    await flushPromises()

    expect(Map).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ center: { lat: -25.9655, lng: 32.5832 } }))
    expect(Marker).toHaveBeenCalledWith(expect.objectContaining({ position: { lat: -25.9655, lng: 32.5832 }, title: 'Ana' }))
    expect(wrapper.find('iframe').exists()).toBe(false)
    wrapper.unmount()
  })

  it('falls back to the OpenStreetMap embed when the Google script fails to load', async () => {
    hasKey.mockReturnValue(true)
    loadMaps.mockRejectedValue(new Error('blocked'))

    const wrapper = mount(AddressMiniMap, { props: { address } })
    await flushPromises()

    expect(wrapper.find('iframe').exists()).toBe(true)
  })
})
