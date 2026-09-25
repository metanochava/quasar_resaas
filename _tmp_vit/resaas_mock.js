import { vi } from 'vitest'
export const HTTPAuth = { get: vi.fn(), post: vi.fn() }
export const url = ({ url, params }) => (params ? `${url}?${new URLSearchParams(params)}` : url)
export const tdc = t => t
export const displayValue = v => (v && typeof v === 'object' ? v.label : v)
export const AlertSuccess = vi.fn()
