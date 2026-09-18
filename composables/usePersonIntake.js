import { ref } from 'vue'

import { usePersonStore } from '../stores/PersonStore'
import { usePersonContactStore } from '../stores/PersonContactStore'
import { useDocumentStore } from '../stores/DocumentStore'
import { buildWritePayload, updateWithPayload, omit } from '../utils/payload'
import { toRelationOption } from '../utils/autoForm'
import { rawValue } from '../utils/display'

// Everything a "register a Person as <something>" page needs that has
// nothing to do with WHAT they are registered as: the Person form (BaseStore
// state), the staged Documents/PersonContacts, duplicate detection
// (PersonAPIView.match + PersonMatchDialog), and the load/diff-save of an
// existing Person for edit pages. The business page (add_employee,
// add_paciente, a future Student/Customer intake) only adds its own record
// (Employee/Paciente/...) on top - see PersonIntakeSections.vue for the
// matching UI.
//
// Documents/contacts live in local arrays, not on a store's .form (a store
// holds ONE record): on create they are sent inside the business module's
// own atomic register action; on edit each row is diffed against what
// existed when the session started (see saveExisting()).
export function usePersonIntake() {
  const Person = usePersonStore()
  const PersonContact = usePersonContactStore()
  const Document = useDocumentStore()

  // ---------------- schema lookup ----------------
  // Person/PersonContact/Document.fields (from each store's loadSchema())
  // carry the real component/props/rules resolved from the backend model;
  // s-field uses that to pick the widget. Falls back to a plain text
  // field before the schema has loaded.
  function fieldOf(store, name) {
    return (store.fields || []).find(f => f.name === name) || { name, type: 'CharField', label: name }
  }

  // ---------------- staged emergency contacts ----------------
  let contactKeySeq = 0
  const contacts = ref([])

  function addContact() {
    contacts.value.push({
      _key: ++contactKeySeq,
      id: null,
      name: '',
      relationship: '',
      phone: '',
      alternative_phone: '',
      email: '',
      is_primary: contacts.value.length === 0,
      is_emergency: false,
      notes: ''
    })
  }

  function removeContact(index) {
    contacts.value.splice(index, 1)
  }

  // ---------------- staged documents ----------------
  let documentKeySeq = 0
  const documents = ref([])

  function addDocument() {
    documents.value.push({
      _key: ++documentKeySeq,
      id: null,
      tipo: null,
      numero: '',
      data_emissao: null,
      data_validade: null,
      arquivo: null
    })
  }

  function removeDocument(index) {
    documents.value.splice(index, 1)
  }

  // Document.tipo is a relation: the s-select the schema builds for it
  // works on {label, value} option objects (and carries the add/edit/view
  // menu for document types); everything sent to the API takes the value.
  const typeId = (tipo) => rawValue(tipo)

  // ---------------- person matching ----------------
  const matchDialogOpen = ref(false)
  const matchCandidatesList = ref([])
  const selectedPerson = ref(null)

  // True once the user explicitly resolved the match step for THIS person
  // (picked a candidate, or confirmed "create new person anyway") - later
  // saves in the same visit skip matching so one confirmation doesn't
  // reopen the dialog on every click. Use clearSelectedPerson() to go back
  // and re-match from scratch.
  const matchResolved = ref(false)

  function clearSelectedPerson() {
    selectedPerson.value = null
    matchResolved.value = false
  }

  let resolveMatchChoice = null

  function waitForMatchChoice() {
    return new Promise(resolve => { resolveMatchChoice = resolve })
  }

  function onMatchSelect(candidate) {
    selectedPerson.value = candidate
    matchResolved.value = true
    matchDialogOpen.value = false
    resolveMatchChoice?.('use-existing')
  }

  function onMatchCreateNew() {
    matchResolved.value = true
    matchDialogOpen.value = false
    resolveMatchChoice?.('create-new')
  }

  function onMatchCancel() {
    matchDialogOpen.value = false
    resolveMatchChoice?.('cancel')
  }

  function buildMatchPayload() {
    return {
      email: Person.form.email,
      phone: Person.form.phone,
      alternative_phone: Person.form.alternative_phone,
      name: Person.form.name,
      surname: Person.form.surname,
      date_of_birth: Person.form.date_of_birth,
      documents: documents.value
        .filter(d => d.tipo && d.numero)
        .map(d => ({ tipo: typeId(d.tipo), numero: d.numero }))
    }
  }

  // Runs duplicate detection unless this visit already resolved it.
  // Resolves 'cancel' when the user backs out of the dialog, otherwise
  // 'ready' (selectedPerson / matchResolved now say what to register).
  async function resolveMatch() {
    if (selectedPerson.value || matchResolved.value) return 'ready'

    const candidates = await Person.matchCandidates(buildMatchPayload())

    if (!candidates.length) {
      matchResolved.value = true
      return 'ready'
    }

    matchCandidatesList.value = candidates
    matchDialogOpen.value = true

    const choice = await waitForMatchChoice()
    return choice === 'cancel' ? 'cancel' : 'ready'
  }

  // ---------------- create payload ----------------
  // The photo rides separately (its own multipart part), and a REUSED
  // person is never edited from here - so personData/photo are only sent
  // for a genuinely new Person.
  function buildPersonData() {
    return omit(Person.form, ['photo', 'id'])
  }

  function registrationPayload() {
    const reusing = !!selectedPerson.value

    return {
      personId: reusing ? selectedPerson.value.id : null,
      personData: reusing ? null : buildPersonData(),
      photo: reusing ? null : (Person.form.photo instanceof File ? Person.form.photo : null),
      documents: documents.value
        .filter(d => d.tipo && d.numero)
        .map(d => ({
          tipo: typeId(d.tipo),
          numero: d.numero,
          data_emissao: d.data_emissao || null,
          data_validade: d.data_validade || null,
          arquivo: d.arquivo instanceof File ? d.arquivo : null
        })),
      contacts: contacts.value
        .filter(c => c.name?.trim())
        .map(contact => omit(contact, ['_key', 'id']))
    }
  }

  // ---------------- edit: load / diff-save ----------------
  const originalDocumentIds = ref(new Set())
  const originalContactIds = ref(new Set())

  // Loads an existing Person's form plus its documents/contacts. Needs
  // list_personcontact/list_document - showing what's already on file is
  // the whole point of an edit screen - so a denied list just starts
  // that section empty instead of blocking the page.
  async function loadExisting(person) {
    Person.form = { ...person }
    matchResolved.value = true

    await Promise.allSettled([
      PersonContact.loadData({ person: person.id, page: 1, page_size: 100 }),
      // object_id alone scopes this to the right owner - it is a UUID
      // (Person's own pk), so a collision with another model's Document
      // via the same generic relation is not a realistic concern.
      Document.loadData({ object_id: person.id, page: 1, page_size: 100 })
    ])

    contacts.value = (PersonContact.rows || []).map(row => ({ _key: ++contactKeySeq, ...row }))
    documents.value = (Document.rows || []).map(row => ({
      _key: ++documentKeySeq,
      ...row,
      // raw pk -> the option object the relation select shows
      tipo: row.tipo_data ? toRelationOption(row.tipo_data) : row.tipo
    }))

    originalContactIds.value = new Set(contacts.value.map(c => c.id))
    originalDocumentIds.value = new Set(documents.value.map(d => d.id))
  }

  async function saveContactRow(row, personId) {
    const fields = omit(row, ['_key'])

    if (row.id) {
      PersonContact.form = { ...fields }
      await updateWithPayload(PersonContact, buildWritePayload(fields, PersonContact.fields))
    } else {
      PersonContact.form = { ...fields, id: undefined, person: personId }
      await PersonContact.create()
    }
  }

  async function saveDocumentRow(row, personId) {
    const fields = omit(row, ['_key'])

    if (row.id) {
      Document.form = { ...fields }
      await updateWithPayload(Document, buildWritePayload(fields, Document.fields))
    } else {
      await Person.addDocument(personId, {
        tipo: typeId(fields.tipo),
        numero: fields.numero,
        data_emissao: fields.data_emissao || null,
        data_validade: fields.data_validade || null,
        arquivo: fields.arquivo instanceof File ? fields.arquivo : null
      })
    }
  }

  // PATCHes the existing Person (an unchanged photo is never resent - a
  // FileField only accepts a real upload) and diffs documents/contacts
  // against what loadExisting() saw: rows without an id are created, rows
  // with one updated, ids no longer present deleted. Each row is its own
  // request (not one atomic transaction like a first-time register) - a
  // failure leaves the rows already saved saved.
  async function saveExisting() {
    const personId = Person.form.id
    const newPhoto = Person.form.photo instanceof File ? Person.form.photo : null

    // Write payload (see utils/payload.js): the loaded form is the API's
    // READ shape ({id,value,label} choices, {url,...} files, computed
    // extras) which the serializer would reject. The address is a nested
    // object the serializer accepts as-is; a new photo goes in its own
    // request below so the generic multipart builder never has to
    // flatten that nested address.
    await updateWithPayload(
      Person,
      buildWritePayload(Person.form, Person.fields, { passthrough: ['address'], exclude: ['photo'] })
    )

    if (newPhoto) {
      Person.form = { id: personId }
      await updateWithPayload(Person, { photo: newPhoto })
    }


    const currentContacts = contacts.value.filter(c => c.name?.trim())
    for (const row of currentContacts) await saveContactRow(row, personId)
    for (const removedId of originalContactIds.value) {
      if (!currentContacts.some(c => c.id === removedId)) {
        PersonContact.form = { id: removedId }
        await PersonContact.remove()
      }
    }

    const currentDocuments = documents.value.filter(d => d.tipo && d.numero)
    for (const row of currentDocuments) await saveDocumentRow(row, personId)
    for (const removedId of originalDocumentIds.value) {
      if (!currentDocuments.some(d => d.id === removedId)) {
        Document.form = { id: removedId }
        await Document.remove()
      }
    }
  }

  // ---------------- lifecycle ----------------
  // Only the schemas are needed for the sub-forms (fieldOf()) - .init()
  // would also run loadData(), requiring list_person/list_personcontact/
  // list_document for lists this page never shows. Relation selects (e.g.
  // the document type) search the API themselves, so nothing else to
  // preload.
  async function init() {
    await Promise.all([
      Person.loadSchemaOnce(),
      PersonContact.loadSchemaOnce(),
      Document.loadSchemaOnce()
    ])
  }

  function reset({ withBlankContact = true } = {}) {
    Person.resetForm?.()
    contacts.value = []
    documents.value = []
    originalContactIds.value = new Set()
    originalDocumentIds.value = new Set()
    selectedPerson.value = null
    matchResolved.value = false
    if (withBlankContact) addContact()
  }

  function hasUnsavedData() {
    return !!(
      selectedPerson.value ||
      Person.form.name || Person.form.surname || Person.form.email || Person.form.phone ||
      documents.value.length || contacts.value.some(c => c.name?.trim())
    )
  }

  return {
    // stores (for v-model bindings / errors)
    Person, PersonContact, Document,
    // state
    contacts, documents, selectedPerson, matchResolved,
    matchDialogOpen, matchCandidatesList,
    // helpers
    fieldOf,
    addContact, removeContact, addDocument, removeDocument,
    // matching
    resolveMatch, clearSelectedPerson,
    onMatchSelect, onMatchCreateNew, onMatchCancel,
    // create / edit
    registrationPayload, loadExisting, saveExisting,
    // lifecycle
    init, reset, hasUnsavedData
  }
}
