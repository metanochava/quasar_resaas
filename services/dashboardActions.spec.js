import { describe, it, expect, vi } from 'vitest'
import { resolveDashboardAction, resolveTemplate, registerActionHandler } from './dashboardActions'

describe('resolveTemplate', () => {
  it('substitutes {key} placeholders from context', () => {
    expect(resolveTemplate('/patients/{id}', { id: '42' })).toBe('/patients/42')
  })

  it('leaves the placeholder untouched when the key is missing from context', () => {
    expect(resolveTemplate('/patients/{id}', {})).toBe('/patients/{id}')
  })

  it('resolves placeholders inside nested objects (route.params/query)', () => {
    const result = resolveTemplate({ id: '{id}', status: '{status}' }, { id: '7', status: 'confirmed' })
    expect(result).toEqual({ id: '7', status: 'confirmed' })
  })

  it('resolves placeholders inside arrays', () => {
    expect(resolveTemplate(['{id}', 'fixed'], { id: '1' })).toEqual(['1', 'fixed'])
  })

  it('passes through non-string/object/array values unchanged', () => {
    expect(resolveTemplate(42, {})).toBe(42)
    expect(resolveTemplate(null, {})).toBeNull()
  })
})

describe('resolveDashboardAction', () => {
  it('route: pushes the resolved route via the given router', () => {
    const push = vi.fn()
    const action = { type: 'route', route: { name: 'view_paciente', params: { id: '{id}' } } }

    resolveDashboardAction(action, { router: { push }, context: { id: '99' } })

    expect(push).toHaveBeenCalledWith({ name: 'view_paciente', params: { id: '99' }, query: undefined })
  })

  it('route: does nothing without a router or without route.name', () => {
    const push = vi.fn()
    resolveDashboardAction({ type: 'route', route: {} }, { router: { push } })
    expect(push).not.toHaveBeenCalled()
  })

  it('refresh: calls onRefresh', () => {
    const onRefresh = vi.fn()
    resolveDashboardAction({ type: 'refresh', name: 'reload' }, { onRefresh })
    expect(onRefresh).toHaveBeenCalled()
  })

  it('fullscreen: calls onFullscreen', () => {
    const onFullscreen = vi.fn()
    resolveDashboardAction({ type: 'fullscreen', name: 'expand' }, { onFullscreen })
    expect(onFullscreen).toHaveBeenCalled()
  })

  it('dialog: calls onDialog with the action', () => {
    const onDialog = vi.fn()
    const action = { type: 'dialog', name: 'info' }
    resolveDashboardAction(action, { onDialog })
    expect(onDialog).toHaveBeenCalledWith(action)
  })

  it('unknown action is a no-op, never throws (unsupported type must not crash the dashboard)', () => {
    expect(() => resolveDashboardAction({ type: 'teleport' }, {})).not.toThrow()
  })

  it('null/undefined action is a no-op', () => {
    expect(() => resolveDashboardAction(null, {})).not.toThrow()
  })

  it('registerActionHandler adds a new resolvable type without touching existing ones', () => {
    const spy = vi.fn()
    registerActionHandler('export', spy)

    resolveDashboardAction({ type: 'export', name: 'export_csv' }, { foo: 'bar' })

    expect(spy).toHaveBeenCalledWith({ type: 'export', name: 'export_csv' }, { foo: 'bar' })
  })
})

describe('dialog actions open a registered dashboard dialog', () => {
  it('opens the component registered under action.dialog with the row as context', async () => {
    const { registerDashboardDialog, openDialog, closeDashboardDialog } = await import('./dashboardDialogs')
    const Component = { name: 'VitalsDialog', render: () => null }
    registerDashboardDialog('demo.vitals', Component)
    const onRefresh = vi.fn()

    resolveDashboardAction({ type: 'dialog', dialog: 'demo.vitals' }, { context: { id: 'a1' }, onRefresh })

    expect(openDialog.value.component.name).toBe('VitalsDialog')
    expect(openDialog.value.context).toEqual({ id: 'a1' })
    openDialog.value.onSaved()
    expect(onRefresh).toHaveBeenCalled()
    closeDashboardDialog()
    expect(openDialog.value).toBeNull()
  })

  it('an unregistered dialog opens nothing (warning only)', async () => {
    const { openDialog } = await import('./dashboardDialogs')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    resolveDashboardAction({ type: 'dialog', dialog: 'nobody.registered' }, { context: {} })

    expect(openDialog.value).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('a widget handling onDialog itself wins', async () => {
    const { openDialog } = await import('./dashboardDialogs')
    const onDialog = vi.fn()

    resolveDashboardAction({ type: 'dialog', dialog: 'demo.vitals' }, { onDialog })

    expect(onDialog).toHaveBeenCalled()
    expect(openDialog.value).toBeNull()
  })
})
