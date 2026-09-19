import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'

import {
  translateTitle, composeTitle, createPageTitleState, usePageTitle, pageTitle, resolveRouteTitle
} from './pageTitle'

const dictionary = {
  'view of': 'Vista de',
  employee: 'funcionário',
  edit: 'Editar',
  patient: 'paciente',
  'edit patient': 'Editar paciente'
}
const translate = (text) => dictionary[String(text).toLowerCase().trim()] || text

describe('translateTitle', () => {
  it('translates a whole known phrase', () => {
    expect(translateTitle('Edit patient', translate)).toBe('Editar paciente')
  })
  it('re-translates a title composed of known parts (longest sequence first)', () => {
    expect(translateTitle('View of employee', translate)).toBe('Vista de funcionário')
  })
  it('keeps unknown words and never returns undefined', () => {
    expect(translateTitle('Something new', translate)).toBe('Something new')
    expect(translateTitle('', translate)).toBe('')
    expect(translateTitle(undefined, translate)).toBe('')
  })
})

describe('composeTitle', () => {
  it('appends the app name', () => {
    expect(composeTitle('Patients', 'RESAAS')).toBe('Patients | RESAAS')
  })
  it('falls back to the app name without a title, and does not repeat it', () => {
    expect(composeTitle('', 'RESAAS')).toBe('RESAAS')
    expect(composeTitle('RESAAS', 'RESAAS')).toBe('RESAAS')
  })
})

describe('title stack', () => {
  it('the most recent override wins and the previous one returns when it goes away', () => {
    const t = createPageTitleState()
    expect(t.overrideTitle()).toBe(null)

    t.setEntry(1, 'Page')
    t.setEntry(2, 'Modal')
    expect(t.overrideTitle()).toBe('Modal')

    t.removeEntry(2)
    expect(t.overrideTitle()).toBe('Page')

    t.removeEntry(1)
    expect(t.overrideTitle()).toBe(null)
  })
  it('updating a title keeps its position (a loaded name does not jump above a modal)', () => {
    const t = createPageTitleState()
    t.setEntry(1, 'Loading...')
    t.setEntry(2, 'Modal')
    t.setEntry(1, 'Ana Costa')
    expect(t.overrideTitle()).toBe('Modal')
  })
})

describe('resolveRouteTitle', () => {
  it('accepts a string or a function of the route', () => {
    expect(resolveRouteTitle({ meta: { title: 'A' } })).toBe('A')
    expect(resolveRouteTitle({ meta: { title: r => `B ${r.params.id}` }, params: { id: 7 } })).toBe('B 7')
    expect(resolveRouteTitle({ meta: {} })).toBeUndefined()
  })
})

describe('usePageTitle', () => {
  const mounted = []

  beforeEach(() => { pageTitle.state.entries.splice(0) })
  // a component left mounted keeps its watcher alive and would re-register
  // its title in the shared stack during a later test
  afterEach(() => { mounted.splice(0).forEach(wrapper => wrapper.unmount()) })

  const mountPage = (component) => {
    const wrapper = mount(component)
    mounted.push(wrapper)
    return wrapper
  }

  const Page = (source, options) => defineComponent({
    setup() { usePageTitle(source, options); return () => h('div') }
  })

  it('applies while mounted and is removed on unmount', () => {
    const wrapper = mountPage(Page(() => 'Ana Costa'))
    expect(pageTitle.overrideTitle()).toBe('Ana Costa')

    wrapper.unmount()
    mounted.splice(0)
    expect(pageTitle.overrideTitle()).toBe(null)
  })

  it('follows a reactive title', async () => {
    const name = ref('Loading')
    mountPage(Page(() => name.value))
    name.value = 'Ana Costa'
    await nextTick()
    expect(pageTitle.overrideTitle()).toBe('Ana Costa')
  })

  it('a modal only overrides while it is open', async () => {
    const open = ref(false)
    mountPage(Page('Match found', { active: () => open.value }))
    expect(pageTitle.overrideTitle()).toBe(null)

    open.value = true
    await nextTick()
    expect(pageTitle.overrideTitle()).toBe('Match found')

    open.value = false
    await nextTick()
    expect(pageTitle.overrideTitle()).toBe(null)
  })

  it('a modal over a page wins, then the page title comes back', async () => {
    const open = ref(false)
    mountPage(Page('Patient Ana'))
    mountPage(Page('Match found', { active: () => open.value }))

    open.value = true
    await nextTick()
    expect(pageTitle.overrideTitle()).toBe('Match found')

    open.value = false
    await nextTick()
    expect(pageTitle.overrideTitle()).toBe('Patient Ana')
  })

  it('an empty title is no override', () => {
    mountPage(Page(() => ''))
    expect(pageTitle.overrideTitle()).toBe(null)
  })
})
