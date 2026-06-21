import { tdc, HTTPAuth, url } from './../index'

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
  const label = tdc(String(f.verbose_name || f.label || f.name || 'field'))

  // required do backend: required = not blank

  if (f.required) {
    rules.push(v => {

      // null ou undefined
      if (v === null || v === undefined) {
        return `${label}: ${tdc('required')}`
      }

      // arrays (ManyToMany, multiselect)
      if (Array.isArray(v)) {
        return (
          v.length > 0 ||
          `${label}: ${tdc('required')}`
        )
      }

      // strings
      if (typeof v === 'string') {
        return (
          v.trim() !== '' ||
          `${label}: ${tdc('required')}`
        )
      }

      // objetos (selects que devolvem {label, value})
      if (typeof v === 'object') {
        return (
          Object.keys(v).length > 0 ||
          `${label}: ${tdc('required')}`
        )
      }

      // números (0, 1, 2, ...)
      // booleanos (true, false)
      return true
    })
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
  const { data } = await HTTPAuth.get(url({type:'u', url: 'django_resaas/relations/',  params: { model: relationStr, search: search || '' }}))

  // esperado: [{id, label}] ou [{id, name}] etc
  const rows = data?.results || data?.data || data || []
  return rows.map(r => ({
    label: tdc(String(r.label || r.name || r.name || r.title || r.id)),
    value: r.id
  }))
}

export async function buildFormFromSchema({
  app,
  model,
  fetchRelationOptions = null,
  schemaPath = 'fields'
} = {}) {

  if (!app || !model) {
    throw new Error('app/model required')
  }

  const { data } = await HTTPAuth.get(
    url({
      type: 'u',
      url: `django_resaas/resaasapps/${app}/${model}/schema/`,
      params: {}
    })
  )

  const fields =
    schemaPath === 'data.fields'
      ? (data?.data?.fields || [])
      : (data?.fields || [])

  const actions = data?.actions || []
  const config = data?.config || {}

  const out = []

  const relFetcher = fetchRelationOptions
    ? (relation, search) => fetchRelationOptions(relation, search)
    : (relation, search) => defaultFetchRelationOptions(relation, search)

  const relFetcherDebounced = debounceAsync(relFetcher, 350)

  for (const f of fields) {
    if (!f?.name) continue

    const label = tdc(
      String(
        f.label ||
        f.verbose_name ||
        f.name
      )
    )

    const props = {
      filled: true,
      dense: true,
      clearable: true,
      ...(f.props || {})
    }

    props.label = label
    props.rules = buildRulesFromSchemaField(f)

    if (f.ui?.isRelation && f.relation) {

      const relationKeyBase = f.relation

      props.options = props.options || []

      props.onFilter = async (val, update, abort) => {
        try {
          const q = (val || '').trim()
          const cacheKey = `${relationKeyBase}::${q}`

          if (__relationCache.has(cacheKey)) {
            update(() => {
              props.options = __relationCache.get(cacheKey)
            })
            return
          }

          const opts = await relFetcherDebounced(
            relationKeyBase,
            q
          )

          __relationCache.set(cacheKey, opts)

          update(() => {
            props.options = opts
          })

        } catch (e) {
          abort?.()
        }
      }

      try {
        const cacheKey = `${relationKeyBase}::`

        if (__relationCache.has(cacheKey)) {
          props.options = __relationCache.get(cacheKey)
        } else {
          const opts = await relFetcher(
            relationKeyBase,
            ''
          )
          __relationCache.set(cacheKey, opts)
          props.options = opts
        }
      } catch {}
    }

    // ---------- choices override ----------
    if (Array.isArray(f.choices) && f.choices.length) {
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

    out.push({
      ...f,

      label,

      component: f.component || 's-input',

      props,

      ui: {
        isFile: isFileType(f.type),
        isImage: f.type === 'ImageField',
        isJson: isJsonType(f.type),
        isNumeric: isNumericType(f.type),
        isChar: isCharType(f.type),
        isRelation: isRelationType(f.type),
        ...(f.ui || {})
      }
    })
  }

  return {
    fields: out,
    actions,
    config
  }
}