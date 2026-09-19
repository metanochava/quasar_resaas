import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { HTTPAuth } from '../services/api'
import { usePersonIntake } from './usePersonIntake'

let intake

beforeEach(() => {
  setActivePinia(createPinia())
  intake = usePersonIntake()
  intake.reset({ withBlankContact: false })
})

describe('usePersonIntake - duplicate matching', () => {
  it('resolves straight to ready (and remembers it) when there are no candidates', async () => {
    const match = vi.spyOn(intake.Person, 'matchCandidates').mockResolvedValue([])

    expect(await intake.resolveMatch()).toBe('ready')
    expect(intake.matchResolved.value).toBe(true)

    await intake.resolveMatch()
    expect(match).toHaveBeenCalledTimes(1)
  })

  it('opens the dialog for candidates and waits for the user choice', async () => {
    vi.spyOn(intake.Person, 'matchCandidates').mockResolvedValue([{ id: 'p1', full_name: 'Ana' }])

    const pending = intake.resolveMatch()
    await Promise.resolve()
    await Promise.resolve()
    expect(intake.matchDialogOpen.value).toBe(true)

    intake.onMatchSelect({ id: 'p1' })

    expect(await pending).toBe('ready')
    expect(intake.selectedPerson.value.id).toBe('p1')
    expect(intake.matchDialogOpen.value).toBe(false)
  })

  it('reports cancel when the user backs out', async () => {
    vi.spyOn(intake.Person, 'matchCandidates').mockResolvedValue([{ id: 'p1' }])

    const pending = intake.resolveMatch()
    await Promise.resolve()
    await Promise.resolve()
    intake.onMatchCancel()

    expect(await pending).toBe('cancel')
    expect(intake.matchResolved.value).toBe(false)
  })

  it('"create new anyway" resolves without selecting a person', async () => {
    vi.spyOn(intake.Person, 'matchCandidates').mockResolvedValue([{ id: 'p1' }])

    const pending = intake.resolveMatch()
    await Promise.resolve()
    await Promise.resolve()
    intake.onMatchCreateNew()

    expect(await pending).toBe('ready')
    expect(intake.selectedPerson.value).toBe(null)
    expect(intake.matchResolved.value).toBe(true)
  })
})

describe('usePersonIntake - registration payload', () => {
  it('sends person data and photo for a new person, never the id, and skips empty rows', () => {
    const photo = new File(['x'], 'p.png', { type: 'image/png' })
    intake.Person.form = { id: 'x', name: 'Ana', surname: 'Costa', photo }
    intake.addDocument()
    intake.documents.value[0].tipo = 't1'
    intake.documents.value[0].numero = '123'
    intake.addDocument() // empty - must be skipped
    intake.addContact()
    intake.contacts.value[0].name = 'Irmao'
    intake.addContact() // empty - must be skipped

    const payload = intake.registrationPayload()

    expect(payload.personId).toBe(null)
    expect(payload.personData).toEqual({ name: 'Ana', surname: 'Costa' })
    expect(payload.photo).toStrictEqual(photo)
    expect(payload.documents).toHaveLength(1)
    expect(payload.contacts).toHaveLength(1)
    expect(payload.contacts[0]).not.toHaveProperty('_key')
    expect(payload.contacts[0]).not.toHaveProperty('id')
  })

  it('a reused person sends only its id - never person data or a photo', () => {
    intake.Person.form = { name: 'Ignored', photo: new File(['x'], 'p.png') }
    intake.selectedPerson.value = { id: 'p9' }

    const payload = intake.registrationPayload()

    expect(payload).toMatchObject({ personId: 'p9', personData: null, photo: null })
  })
})

describe('usePersonIntake - document type is a relation option', () => {
  it('sends the plain id for a {label, value} option in the create payload and the match payload', () => {
    intake.Person.form = { name: 'Ana' }
    intake.addDocument()
    intake.documents.value[0].tipo = { label: 'ID Card', value: 't1' }
    intake.documents.value[0].numero = '123'

    expect(intake.registrationPayload().documents[0].tipo).toBe('t1')
  })

  it('loadExisting turns the raw pk + tipo_data into the option the relation select shows', async () => {
    vi.spyOn(intake.PersonContact, 'loadData').mockImplementation(async function () { this.rows = [] })
    vi.spyOn(intake.Document, 'loadData').mockImplementation(async function () {
      this.rows = [{ id: 'd1', tipo: 't1', tipo_data: { id: 't1', name: 'ID Card' }, numero: '1' }]
    })

    await intake.loadExisting({ id: 'p1', name: 'Ana' })

    expect(intake.documents.value[0].tipo).toMatchObject({ value: 't1', label: 'ID Card' })
  })

  it('adds a new document to an existing person with the plain type id', async () => {
    intake.Person.fields = []
    intake.Person.form = { id: 'p1' }
    intake.addDocument()
    intake.documents.value[0].tipo = { label: 'Passport', value: 't2' }
    intake.documents.value[0].numero = 'P-9'
    vi.spyOn(intake.Person, 'update').mockResolvedValue()
    const add = vi.spyOn(intake.Person, 'addDocument').mockResolvedValue({})

    await intake.saveExisting()

    expect(add).toHaveBeenCalledWith('p1', expect.objectContaining({ tipo: 't2', numero: 'P-9' }))
  })
})

describe('usePersonIntake - edit (load + diff save)', () => {
  it('loads person, documents and contacts and remembers their ids', async () => {
    vi.spyOn(intake.PersonContact, 'loadData').mockImplementation(async function () {
      this.rows = [{ id: 'c1', name: 'Irmao', person: 'p1' }]
    })
    vi.spyOn(intake.Document, 'loadData').mockImplementation(async function () {
      this.rows = [{ id: 'd1', tipo: 't1', numero: '1' }]
    })

    await intake.loadExisting({ id: 'p1', name: 'Ana' })

    expect(intake.Person.form.name).toBe('Ana')
    expect(intake.matchResolved.value).toBe(true)
    expect(intake.contacts.value.map(c => c.id)).toEqual(['c1'])
    expect(intake.documents.value.map(d => d.id)).toEqual(['d1'])
  })

  it('a denied list (no permission) leaves that section empty instead of failing', async () => {
    vi.spyOn(intake.PersonContact, 'loadData').mockRejectedValue(new Error('403'))
    vi.spyOn(intake.Document, 'loadData').mockRejectedValue(new Error('403'))
    intake.PersonContact.rows = []
    intake.Document.rows = []

    await expect(intake.loadExisting({ id: 'p1', name: 'Ana' })).resolves.not.toThrow()
    expect(intake.contacts.value).toEqual([])
  })

  it('saveExisting creates new rows, updates existing ones and deletes removed ones', async () => {
    vi.spyOn(intake.PersonContact, 'loadData').mockImplementation(async function () {
      this.rows = [{ id: 'c1', name: 'Keep' }, { id: 'c2', name: 'Drop' }]
    })
    vi.spyOn(intake.Document, 'loadData').mockImplementation(async function () {
      this.rows = [{ id: 'd1', tipo: 't', numero: '1' }, { id: 'd2', tipo: 't', numero: '2' }]
    })
    await intake.loadExisting({ id: 'p1', name: 'Ana', photo: { url: 'http://x/p.png' } })

    intake.contacts.value = intake.contacts.value.filter(c => c.id === 'c1')
    intake.contacts.value[0].name = 'Keep edited'
    intake.addContact()
    intake.contacts.value[1].name = 'Brand new'
    intake.documents.value = intake.documents.value.filter(d => d.id === 'd1')
    intake.addDocument()
    intake.documents.value[1].tipo = 't'
    intake.documents.value[1].numero = 'NEW'

    const personUpdate = vi.spyOn(intake.Person, 'update').mockImplementation(async function () {
      expect(this.form).not.toHaveProperty('photo') // unchanged photo never resent
    })
    const contactUpdate = vi.spyOn(intake.PersonContact, 'update').mockResolvedValue()
    const contactCreate = vi.spyOn(intake.PersonContact, 'create').mockImplementation(async function () {
      expect(this.form.person).toBe('p1')
      expect(this.form.id).toBeUndefined()
    })
    const contactRemove = vi.spyOn(intake.PersonContact, 'remove').mockImplementation(async function () {
      expect(this.form.id).toBe('c2')
    })
    const documentUpdate = vi.spyOn(intake.Document, 'update').mockResolvedValue()
    const documentRemove = vi.spyOn(intake.Document, 'remove').mockImplementation(async function () {
      expect(this.form.id).toBe('d2')
    })
    const addDocument = vi.spyOn(intake.Person, 'addDocument').mockResolvedValue({})

    await intake.saveExisting()

    expect(personUpdate).toHaveBeenCalledTimes(1)
    expect(contactUpdate).toHaveBeenCalledTimes(1)
    expect(contactCreate).toHaveBeenCalledTimes(1)
    expect(contactRemove).toHaveBeenCalledTimes(1)
    expect(documentUpdate).toHaveBeenCalledTimes(1)
    expect(addDocument).toHaveBeenCalledWith('p1', expect.objectContaining({ numero: 'NEW' }))
    expect(documentRemove).toHaveBeenCalledTimes(1)
  })

  it('a newly picked photo is sent in its own request, without the rest of the form', async () => {
    const photo = new File(['x'], 'new.png', { type: 'image/png' })
    intake.Person.fields = [{ name: 'name', type: 'CharField' }, { name: 'photo', type: 'ImageField' }]
    intake.Person.form = { id: 'p1', name: 'Ana', photo, address: { id: 'a1', route: 'Rua X' } }

    const bodies = []
    vi.spyOn(intake.Person, 'update').mockImplementation(async function () {
      bodies.push({ ...this.form })
    })

    await intake.saveExisting()

    expect(bodies).toHaveLength(2)
    expect(bodies[0]).toMatchObject({ id: 'p1', name: 'Ana', address: { id: 'a1', route: 'Rua X' } })
    expect(bodies[0]).not.toHaveProperty('photo')
    expect(bodies[1].photo).toStrictEqual(photo)
    expect(bodies[1]).not.toHaveProperty('address') // multipart must never flatten the nested address
  })

  it('sends a WRITE payload: {id,value,label} choices become their value, extras are dropped', async () => {
    intake.Person.fields = [{ name: 'gender', type: 'CharField' }, { name: 'age', type: 'IntegerField', read_only: true }]
    intake.Person.form = { id: 'p1', gender: { id: 'M', value: 'M', label: 'Masculine' }, age: 3, label: 'x' }

    let body
    vi.spyOn(intake.Person, 'update').mockImplementation(async function () { body = { ...this.form } })

    await intake.saveExisting()

    expect(body).toEqual({ id: 'p1', gender: 'M' })
  })
})

describe('usePersonIntake - existing person picked in the relation picker', () => {
  const row = {
    value: 'p7', id: 'p7', label: 'Ana Costa',
    preview: { title: 'Ana Costa', subtitle: ['841110000'], avatar: { url: 'http://x/a.png' }, values: { phone: '841110000' } }
  }

  it('reuses the person: id for the register payload, values read by field name (not position)', () => {
    intake.useExistingPerson(row)

    expect(intake.selectedPerson.value).toMatchObject({ id: 'p7', full_name: 'Ana Costa', email: null, phone: '841110000' })
    expect(intake.matchResolved.value).toBe(true)

    const payload = intake.registrationPayload()
    expect(payload.personId).toBe('p7')
    expect(payload.personData).toBeNull()
  })

  it('exposes the reused person as the picker value, and clearing goes back to a new person', () => {
    expect(intake.pickerValue.value).toBeNull()

    intake.onPersonPicked(row)
    expect(intake.pickerValue.value).toMatchObject({ value: 'p7', label: 'Ana Costa', preview: { title: 'Ana Costa', subtitle: ['841110000'] } })

    intake.onPersonPicked(null)
    expect(intake.selectedPerson.value).toBeNull()
    expect(intake.matchResolved.value).toBe(false)
  })
})

describe('usePersonIntake - viewing the reused person', () => {
  afterEach(() => vi.restoreAllMocks())

  const selected = { id: 'p7', full_name: 'Ana Costa', email: 'a@x.com' }

  it('opens at once with the summary, then shows the full record', async () => {
    const full = { id: 'p7', full_name: 'Ana Costa', blood_type: { label: 'O+' }, address: { formatted_address: 'Maputo' } }
    const get = vi.spyOn(HTTPAuth, 'get').mockResolvedValue({ data: full })
    intake.selectedPerson.value = selected

    const pending = intake.showSelectedPerson()
    expect(intake.detailOpen.value).toBe(true)
    expect(intake.detail.value).toEqual(selected)
    expect(intake.detailLoading.value).toBe(true)

    await pending

    expect(get.mock.calls[0][0]).toContain('django_resaas/persons/p7/')
    expect(intake.detail.value).toEqual(full)
    expect(intake.detailLoading.value).toBe(false)
  })

  it('keeps the summary when the record cannot be read', async () => {
    vi.spyOn(HTTPAuth, 'get').mockRejectedValue(new Error('403'))
    intake.selectedPerson.value = selected

    await intake.showSelectedPerson()

    expect(intake.detail.value).toEqual(selected)
    expect(intake.detailLoading.value).toBe(false)
  })

  it('ignores an answer for a person that is no longer the selected one', async () => {
    let answer
    vi.spyOn(HTTPAuth, 'get').mockReturnValue(new Promise(resolve => { answer = resolve }))
    intake.selectedPerson.value = selected

    const pending = intake.showSelectedPerson()
    intake.selectedPerson.value = { id: 'p8', full_name: 'Other' }
    answer({ data: { id: 'p7', full_name: 'Stale' } })
    await pending

    expect(intake.detail.value).toEqual(selected)
  })

  it('does nothing without a selected person', async () => {
    const get = vi.spyOn(HTTPAuth, 'get')

    await intake.showSelectedPerson()

    expect(get).not.toHaveBeenCalled()
    expect(intake.detailOpen.value).toBe(false)
  })
})
