import { tdc, HTTPAuth, url, guessLabelKey } from './../index'

const __relationCache = new Map()

function debounceAsync(fn, wait = 350) {
  let t = null
  let pending = null
  return (...args) => {
    if (t) clearTimeout(t)
    if (pending) pending.reject?.({ cancelled: true })
    return new Promise((resolve, reject) => {
      pending = { reject }
      t = setTimeout(async () => {
        try { resolve(await fn(...args)) }
        catch (e) { reject(e) }
        finally { pending = null; t = null }
      }, wait)
    })
  }
}

function safeJsonParse(s) {
  try { return { ok: true, value: JSON.parse(s) } } catch { return { ok: false, value: null } }
}

function guessMaskByName(name = '') {
  const n = String(name).toLowerCase()
  if (/(telefone|telemovel|tel|phone|mobile)/.test(n)) return '#########' // ajusta ao teu país
  if (/(nif|vat|tax|contribuinte)/.test(n)) return '#########'
  return null
}

function isFileType(t) { return ['FileField', 'ImageField'].includes(t) }
function isJsonType(t) { return ['JSONField'].includes(t) }
function isNumericType(t) {
  return [
    'IntegerField','BigIntegerField','SmallIntegerField','PositiveIntegerField','PositiveSmallIntegerField',
    'FloatField','DecimalField','MoneyField'
  ].includes(t)
}
function isCharType(t) { return ['CharField','TextField','SlugField','EmailField','URLField','UUIDField'].includes(t) }
function isRelationType(t) { return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t) }

function buildRulesFromSchemaField(f) {
  const rules = []
  const label = tdc(String(f.label || f.verbose_name || f.name || 'field'))

  // required do backend: required = not blank
  if (f.required) {
    rules.push(v => (v !== null && v !== undefined && v !== '') || `${label}: ${tdc('required')}`)
  }

  // min/max length
  if (f.min_length != null) {
    rules.push(v => (v == null || String(v).length >= Number(f.min_length)) || `${label}: ${tdc('min length')} ${f.min_length}`)
  }
  if (f.max_length != null) {
    rules.push(v => (v == null || String(v).length <= Number(f.max_length)) || `${label}: ${tdc('max length')} ${f.max_length}`)
  }

  // numeric min/max
  if (f.min != null) {
    rules.push(v => (v == null || v === '' || Number(v) >= Number(f.min)) || `${label}: ${tdc('min')} ${f.min}`)
  }
  if (f.max != null) {
    rules.push(v => (v == null || v === '' || Number(v) <= Number(f.max)) || `${label}: ${tdc('max')} ${f.max}`)
  }

  // JSON validate
  if (isJsonType(f.type)) {
    rules.push(v => {
      if (v == null || v === '') return true
      return safeJsonParse(v).ok || `${label}: ${tdc('invalid JSON')}`
    })
  }

  return rules
}

// relation loader (ajusta ao teu endpoint real)
async function defaultFetchRelationOptions(relationStr, search = '') {
  // relationStr no schema: "app.Model"
  // Sugestão de endpoint padrão:
  // GET /saas/relations/?model=app.Model&search=...
  // Se tu não tens, troca aqui por GET /saas/<model-endpoint>/
  const { data } = await HTTPAuth.get(url({type:'u', url: '/api/django_resaas/relations/',  params: { model: relationStr, search: search || '' }}))

  // esperado: [{id, label}] ou [{id, nome}] etc
  const rows = data?.results || data?.data || data || []
  return rows.map(r => ({
    label: tdc(String(r.label || r.nome || r.name || r.title || r.id)),
    value: r.id
  }))
}

export async function buildFormFromSchema({
  module,
  model,
  fetchRelationOptions = null, // opcional: injeta a tua função
  schemaPath = 'fields',        // 'fields' OR 'data.fields' (se o teu ok() embrulhar)
  moneyMask = '#.##0,00',       // se usares mask monetária custom
} = {}) {

  if (!module || !model) throw new Error('module/model required')

  const { data } = await HTTPAuth.get(url({type:'u', url:`/api/django_resaas/modulos/${module}/${model}/schema/`, params:{}}))

  // ✅ resolve schemaPath
  const fields = schemaPath === 'data.fields' ? (data?.data?.fields || []) : (data?.fields || [])
  const actions =  data?.actions || []
  const config =  data?.config || {} 

  const out = []

  const relFetcher = fetchRelationOptions
    ? (relation, search) => fetchRelationOptions(relation, search)
    : (relation, search) => defaultFetchRelationOptions(relation, search)

  const relFetcherDebounced = debounceAsync(relFetcher, 350)

  for (const f of fields) {
    if (!f?.name) continue

    let component = 's-input'
    const props = {
      filled: true,
      dense: true,
      clearable: true
    }

    // ---------- base label ----------
    const label = tdc(String(f.label || f.verbose_name || f.name))

    // ---------- default by type ----------
    switch (f.type) {
      // TEXT
      case 'CharField':
      case 'TextField':
      case 'SlugField':
      case 'EmailField':
      case 'URLField':
      case 'UUIDField':
        component = 's-input'
        props.type = 'text'
        if (f.type === 'EmailField') props.type = 'email'
        if (f.type === 'URLField') props.type = 'url'
        if (f.type === 'TextField') {
          props.type = 'textarea'
          props.autogrow = true
        }
        if (f.max_length) props.maxlength = Number(f.max_length)
        break

      // NUMBERS
      case 'IntegerField':
      case 'BigIntegerField':
      case 'SmallIntegerField':
      case 'PositiveIntegerField':
      case 'PositiveSmallIntegerField':
      case 'FloatField':
      case 'DecimalField':
      case 'MoneyField':
        component = 's-input'
        props.type = 'number'
        props.step = (f.type === 'DecimalField' || f.type === 'MoneyField' || f.type === 'FloatField') ? 'any' : '1'
        if (f.min != null) props.min = f.min
        if (f.max != null) props.max = f.max

        // money UX
        if (f.type === 'MoneyField') {
          props.prefix = props.prefix || ''
          props.inputmode = 'decimal'
          // se tu usas s-input-mask / mask plugin:
          // props.mask = moneyMask
        }
        break

      // BOOLEAN
      case 'BooleanField':
        component = 's-switch'
        props.clearable = false
        break

      // DATE/TIME
      case 'DateField':
        component = 's-input'
        props.type = 'date'
        break
      case 'DateTimeField':
        component = 's-input'
        props.type = 'datetime-local'
        break
      case 'TimeField':
        component = 's-input'
        props.type = 'time'
        break

      // JSON
      case 'JSONField':
        component = 's-input'
        props.type = 'textarea'
        props.autogrow = true
        props.placeholder = '{ "key": "value" }'
        break

      // FILE/IMAGE
      case 'FileField':
      case 'ImageField':
        component = 's-upload'
        props.clearable = true
        props.useChips = true
        props.maxFiles = 1
        // preview
        props._isFile = true
        props._isImage = (f.type === 'ImageField')
        break

      // RELATIONS
      case 'ForeignKey':
      case 'OneToOneField':
        component = 's-select'
        props.multiple = false
        props.emitValue = true
        props.mapOptions = true
        props.useInput = true
        props.fillInput = false
        props.inputDebounce = 0 // vamos debounciar manualmente
        props.options = []
        props._relation = true
        props._relationType = f.type
        props.relation = f.relation
        break

      case 'ManyToManyField':
        component = 's-select'
        props.multiple = true
        props.emitValue = true
        props.mapOptions = true
        props.useInput = true
        props.fillInput = false
        props.inputDebounce = 0
        props.options = []
        props._relation = true
        props._relationType = f.type
        props.relation = f.relation
        break

      default:
        component = 's-input'
        props.type = 'text'
    }

    // ---------- choices override ----------
    if (Array.isArray(f.choices) && f.choices.length) {
      component = 's-select'
      props.emitValue = true
      props.mapOptions = true
      props.options = f.choices.map(([v, l]) => ({
        label: tdc(String(l)),
        value: v
      }))
      // se choices, não é relation async
      delete props._relation
      delete props.relation
    }

    // ---------- masks by name ----------
    const m = guessMaskByName(f.name)
    if (m && component === 's-input') props.mask = m

    // ---------- required visual ----------
    props.label = label
    props.rules = buildRulesFromSchemaField(f)

    // ---------- relations lazy load ----------
    if (props._relation && props.relation) {
      const relationKeyBase = props.relation

      props.onFilter = async (val, update, abort) => {
        try {
          const q = (val || '').trim()
          const cacheKey = `${relationKeyBase}::${q}`

          if (__relationCache.has(cacheKey)) {
            update(() => { props.options = __relationCache.get(cacheKey) })
            return
          }

          const opts = await relFetcherDebounced(relationKeyBase, q)
          __relationCache.set(cacheKey, opts)
          update(() => { props.options = opts })
        } catch (e) {
          abort?.()
        }
      }

      // pre-load vazio
      try {
        const cacheKey = `${relationKeyBase}::`
        if (__relationCache.has(cacheKey)) {
          props.options = __relationCache.get(cacheKey)
        } else {
          const opts = await relFetcher(relationKeyBase, '')
          __relationCache.set(cacheKey, opts)
          props.options = opts
        }
      } catch {}
    }

    out.push({
      name: f.name,
      label,
      type: f.type,
      required: !!f.required,
      help_text: f.help_text || '',
      component,
      props,

      // extras úteis pro renderer:
      schema: f,
      ui: {
        isFile: isFileType(f.type),
        isImage: f.type === 'ImageField',
        isJson: isJsonType(f.type),
        isNumeric: isNumericType(f.type),
        isChar: isCharType(f.type),
        isRelation: isRelationType(f.type),
      }
    })
  }

  return {'schema': out, 'actions': actions, 'config': config }
}
