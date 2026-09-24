import { defineStore } from 'pinia'
import { watch } from 'vue'
// before UserStore: UserStore is itself built by createBaseStore (circular import)
import { attachPersistence, isPersistedField, normalizePersistOptions } from './persistence'
import { buildFormFromSchema } from './../utils/autoForm'
import { HTTPAuth, url, HTTPAuthBlob } from '../services/api'
import { parseFieldErrors } from '../boot/alerts'
import { toWriteShapes } from '../utils/payload'
import { applyFieldAccess } from '../utils/fieldAccess'
import { useUserStore } from '../stores/UserStore'

// User.can for field-level authorization (utils/fieldAccess.js). Resolved
// lazily - UserStore itself is built on this module - and fails closed
// (restricted fields hidden) when no store is available.
function userCan() {
  try {
    const User = useUserStore()
    return perm => User.can(perm)
  } catch {
    return () => false
  }
}

// Mesma normalização de FormComponent.vue's normalizeValue() - uma
// relação já resolvida no form como {id, ...}/{value, ...} tem de
// virar só o id/value antes de seguir para a API.
function normalizeFieldValue(v) {
  if (v instanceof File) return v

  if (Array.isArray(v)) {
    return v.map(x => {
      if (x && typeof x === 'object') {
        if ('value' in x) return x.value
        if ('id' in x) return x.id
      }
      return x
    })
  }

  if (v && typeof v === 'object') {
    if ('value' in v) return v.value
    if ('id' in v) return v.id
  }

  return v
}

// Um form pode conter um File (ex.: s-file/s-image-capture) mesmo
// quando a página não passa por FormComponent.vue's próprio
// buildPayload() - por exemplo, PacienteSEPage monta Person.form
// directamente a partir de personFormRef.value.form antes de chamar
// Person.save(). Sem isto, um File dentro de `form` seguiria como
// JSON (perdendo o ficheiro em silêncio) em vez de multipart.
function hasFileValue(form) {
  return Object.values(form || {}).some(v => v instanceof File)
}

function toFormData(form) {
  const fd = new FormData()

  Object.entries(form || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return

    const normalized = normalizeFieldValue(value)

    if (Array.isArray(normalized)) {
      normalized.forEach(item => fd.append(key, item))
      return
    }

    fd.append(key, normalized)
  })

  return fd
}

export function buildRequestPayload(form) {
  return hasFileValue(form) ? toFormData(form) : toWriteShapes(form)
}

// Who the persisted state belongs to (base/persistence.js keys): the signed-in
// user and the selected Entity/Branch, read from UserStore. Only a namespace
// for UX state - the backend still validates the session and the
// X-RESAAS-Context on every request.
function persistIdentity(pinia) {
  try {
    const User = useUserStore(pinia)
    return {
      userId: User.data?.id ?? null,
      entityId: User.Entity?.id ?? null,
      branchId: User.Branch?.id ?? null
    }
  } catch {
    return {}
  }
}

function watchPersistIdentity(pinia, callback) {
  try {
    const User = useUserStore(pinia)
    watch(() => [User.data?.id, User.Entity?.id, User.Branch?.id].join('|'), callback, { flush: 'sync' })
  } catch {
    // no UserStore (isolated tests): the identity never changes
  }
}

// extend.persist (optional, opt-in): keep part of the state in localStorage
// across reloads - see base/persistence.js and
// docs/quasar-resaas/stores/persistence.md. Without it the store is exactly
// the plain Pinia store it always was.
export function createBaseStore(name, config, extend = {}) {

  const persistOptions = normalizePersistOptions(extend.persist, name)

  // 🔥 IMMUTABLE CONFIG (NEVER CHANGES)
  const BASE_CONFIG = Object.freeze({
    url: '' + config.app + '/' + config.model.toLowerCase() + 's',
    app: config.app,
    model: config.model
  })

  // =========================
  // STATE
  // =========================
  const buildState = () => {
    const extended = extend.state ? extend.state() : {}

    return {
      // 🔥 FIXED CONFIG
      _config: BASE_CONFIG,

      // 🔥 DERIVED (never rely on them directly)
      url: BASE_CONFIG.url,
      app: BASE_CONFIG.app,
      model: BASE_CONFIG.model,

      loading: false,
      saving: false,

      _schemaLoaded: false,
      // set from schema.model.endpoint once loadSchema() resolves;
      // the safeUrl getter below prefers this over the app/model
      // convention whenever it's available
      schemaEndpoint: null,
      // fields exactly as the schema returned them; `fields` is this
      // list after field-level authorization for the current user
      // (refreshFieldAccess)
      _schemaFields: [],
      fields: [],
      rows: [],
      showPdf: false,
      pdf: null,
      row: null,
      form: {},

      // Backend validation errors from the last failed create/update,
      // as {field: "message"} (see parseFieldErrors in boot/alerts.js)
      // - ready to bind straight onto an s-input's :error-message,
      // never the raw DRF {field: [...]} shape.
      errors: {},

      actions: [],
      config: {},
      permissions: {},
      pdfConfig: {},
      paginationConfig: {},

      search: '',
      filters: {},

      pagination: {
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0
      },

      ...extended
    }
  }

  const useStore = defineStore(name, {

    state: buildState,

    // =========================
    // GETTERS (SEMPRE USAR ESTES)
    // =========================
    getters: {
      safeApp: (state) => state._config.app,
      safeModel: (state) => state._config.model,

      // Single authority for the resource's base URL. Once the schema
      // has been loaded, `schema.model.endpoint` (the backend's own
      // resolved endpoint - see ResaasSchemaBuilder.build_model) wins;
      // the `{app}/{model}s` convention only remains a fallback for
      // stores that never call loadSchema()/init(). Every action below
      // goes through this getter, so there's exactly one place that
      // knows this rule.
      safeUrl: (state) =>
        (state.schemaEndpoint || state._config.url).replace(/\/+$/, ''),

      item: (state) => state.row,
      items: (state) => state.rows,

      ...(extend.getters || {})
    },

    // =========================
    // ACTIONS
    // =========================
    actions: {

      // =========================
      // 🔍 SEARCH
      // =========================
      // Changing search/filters resets to page 1: a page number that made
      // sense under the old criteria can easily be out of range (or just
      // showing the wrong slice) under the new one - see the FILTERS
      // actions below for the same reasoning.
      setSearch(search) {
        this.search = search
        this.pagination.page = 1
      },

      clearSearch() {
        this.search = ''
        this.pagination.page = 1
      },

      // =========================
      // 🎯 FILTERS
      // =========================
      setFilters(filters = {}) {
        this.filters = { ...filters }
        this.pagination.page = 1
      },

      updateFilter(key, value) {
        this.filters = {
          ...this.filters,
          [key]: value
        }
        this.pagination.page = 1
      },

      removeFilter(key) {
        const newFilters = { ...this.filters }
        delete newFilters[key]
        this.filters = newFilters
        this.pagination.page = 1
      },

      clearFilters() {
        this.filters = {}
        this.pagination.page = 1
      },

      // =========================
      // 📄 PAGINATION
      // =========================
      setPage(page) {
        this.pagination.page = page
      },

      setRowsPerPage(rows) {
        this.pagination.rowsPerPage = rows
      },

      setPagination(pagination = {}) {
        this.pagination = {
          ...this.pagination,
          ...pagination
        }
      },

      resetPagination() {
        this.pagination = {
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0
        }
      },


      // 🔥 GLOBAL SAFETY GUARD
      assertConfig() {
        if (!this._config.app || !this._config.model) {
          console.error('BaseStore CONFIG ERROR:', this._config)
          throw new Error('app/model required')
        }
      },

      // =========================
      // HOOK RUNNER
      // =========================
      async runHook(name, payload) {
        if (extend.hooks && typeof extend.hooks[name] === 'function') {
          return await extend.hooks[name].call(this, payload)
        }
      },

      // =========================
      // INIT SEGURO
      // =========================
      async init() {
        this.assertConfig()

        await this.runHook('beforeInit')

        await this.loadSchemaOnce()
        // the schema is cached, the user's permissions are not (group switch)
        this.refreshFieldAccess()
        await this.loadData()

        await this.runHook('afterInit')
      },

      // =========================
      // SCHEMA
      // =========================
      async loadSchema() {
        this.assertConfig()

        await this.runHook('beforeSchema')

        const rsp = await buildFormFromSchema({
          app: this.safeApp,
          model: this.safeModel
        })

        this._schemaFields = rsp?.fields || []
        this.fields = applyFieldAccess(this._schemaFields, userCan())
        this.actions = rsp?.actions || []
        this.config = rsp?.config || {}
        this.permissions = rsp?.permissions || {}
        this.pdfConfig = rsp?.pdf || {}
        this.schemaEndpoint = rsp?.schema?.model?.endpoint || null

        // schema.pagination (page_size, page_size_options, default_ordering)
        // was being silently dropped - the backend is supposed to be the
        // authority here too, so seed the live pagination cursor from it.
        this.paginationConfig = rsp?.pagination || {}
        // a page size restored from the user's persisted state wins
        if (this.paginationConfig.page_size && !isPersistedField(this, 'pagination')) {
          this.pagination.rowsPerPage = this.paginationConfig.page_size
        }

        await this.runHook('afterSchema', this.fields)
      },

      // Re-applies field-level authorization (utils/fieldAccess.js) to the
      // cached schema fields with the user's CURRENT permissions.
      refreshFieldAccess() {
        if (!this._schemaFields?.length) return
        this.fields = applyFieldAccess(this._schemaFields, userCan())
      },

      async loadSchemaOnce() {
        if (!this._schemaLoaded) {
          await this.loadSchema()
          this._schemaLoaded = true
        }

      },






      

      // =========================
      // LIST
      // =========================
      async loadData(params = {}) {
        this.assertConfig()

        await this.runHook('beforeLoad')

        this.loading = true

        try {
          const { data } = await HTTPAuth.get(
            url({
              type: 'u',
              url: this.safeUrl,
              params: {
                page: this.pagination.page,
                page_size: this.pagination.rowsPerPage,
                search: this.search,
                ...this.filters,
                ...params
              }
            })
          )

          this.rows = data.results || data
          this.pagination.rowsNumber = data.count || this.rows.length

          await this.runHook('afterLoad', this.rows)

        } finally {
          this.loading = false
        }
      },

      // =========================
      // FETCH PAGE (read-only)
      // =========================
      // One page of the collection WITHOUT touching rows/pagination/loading.
      // For side lists that accumulate pages themselves (infinite scroll in a
      // right menu) while the main list keeps using this same store.
      async fetchPage(params = {}) {
        this.assertConfig()

        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: this.safeUrl, params })
        )

        const rows = data.results || data

        return {
          rows,
          count: data.count ?? rows.length,
          hasNext: Boolean(data.next)
        }
      },

      // =========================
      // WRITE BY ID (no store state touched)
      // =========================
      // For side lists (right-menu history) acting on one of their own rows:
      // like fetchPage(), they never touch rows/row/form/pagination, so the
      // page's own list and form are not replaced or reset behind its back.
      async removeById(id) {
        this.assertConfig()

        if (!id) return

        await HTTPAuth.delete(url({ type: 'u', url: `${this.safeUrl}/${id}/` }))
      },

      async patchById(id, payload = {}) {
        this.assertConfig()

        const { data } = await HTTPAuth.patch(
          url({ type: 'u', url: `${this.safeUrl}/${id}/` }),
          buildRequestPayload(payload)
        )

        return data
      },

      // =========================
      // GET BY ID
      // =========================
      getRow(){
        return this.row
      },
      getRows(){
        return this.rows
      },
      getForm(){
        return this.form
      },
      async getById(id, options = {}) {
        this.assertConfig()

        await this.runHook('beforeGet', id)

        if (!id) return

        const { force = false } = options

        if (!force && this.row?.id === id) return this.row

        this.loading = true

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `${this.safeUrl}/${id}/` })
          )

          this.row = data
          this.form = { ...data }

          await this.runHook('afterGet', data)

          return data

        } finally {
          this.loading = false
        }
      },

      // Clears the cached row so the next getById() re-fetches instead
      // of returning the cached copy.
      invalidateRow() {
        this.row = null
      },

      // Re-fetches the currently loaded row by id, bypassing the cache -
      // use after something outside the normal update()/save() flow
      // (a custom action, a websocket event, ...) may have changed it
      // server-side.
      async refreshRow() {
        if (!this.row?.id) return
        return await this.getById(this.row.id, { force: true })
      },

      // =========================
      // CREATE
      // =========================
      async create() {
        this.assertConfig()

        await this.runHook('beforeCreate', this.form)

        this.loading = true
        this.errors = {}

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: this.safeUrl+'/' }),
            buildRequestPayload(this.form)
          )

          this.row = data
          this.form = { ...data }

          // Re-fetch instead of unshift()-ing the new row locally: a
          // generic store can't know the list's real ordering, active
          // filters/search, or the current page - only the server does.
          // This also keeps pagination.rowsNumber correct.
          await this.loadData()

          await this.runHook('afterCreate', data)

          return data

        } catch (error) {
          this.errors = parseFieldErrors(error?.response?.data)
          throw error

        } finally {
          this.loading = false
        }
      },

      // =========================
      // UPDATE
      // =========================
      // `method: 'put'` opts into a full replace when a form is known to
      // always carry a complete representation of the object; the
      // default is PATCH, since a custom form only rendering some of
      // the schema's fields is normal, and PUTting that would ask the
      // backend to treat every missing field as absent.
      async update({ method = 'patch' } = {}) {
        this.assertConfig()

        const id = this.form?.id
        if (!id) return

        await this.runHook('beforeUpdate', this.form)

        this.saving = true
        this.errors = {}

        try {
          const httpMethod = method === 'put' ? 'put' : 'patch'

          const { data } = await HTTPAuth[httpMethod](
            url({ type: 'u', url: `${this.safeUrl}/${id}/` }),
            buildRequestPayload(this.form)
          )

          this.row = data
          this.form = { ...data }

          const index = this.rows.findIndex(i => i.id === data.id)
          if (index !== -1) this.rows[index] = data

          await this.runHook('afterUpdate', data)

          return data

        } catch (error) {
          this.errors = parseFieldErrors(error?.response?.data)
          throw error

        } finally {
          this.saving = false
        }
      },

      // =========================
      // DELETE
      // =========================
      async remove() {
        this.assertConfig()

        const id = this.form?.id
        if (!id) return

        await this.runHook('beforeDelete', id)

        this.saving = true

        try {
          await HTTPAuth.delete(
            url({ type: 'u', url: `${this.safeUrl}/${id}/` })
          )

          // If this was the last row on a page beyond the first, step
          // back a page BEFORE reloading: the default DRF paginator
          // returns 404 "Invalid page" for a page number past the new
          // last page, so re-requesting the now-empty current page
          // would turn a successful delete into a thrown error.
          if (this.rows.length <= 1 && this.pagination.page > 1) {
            this.pagination.page -= 1
          }

          // Re-fetch instead of filtering the row out locally: with the
          // deleted row gone, the current page can now be short a row
          // relative to the server's real count/pagination - only a
          // fresh loadData() gets rowsNumber and the page contents right.
          await this.loadData()

          this.resetForm()

          await this.runHook('afterDelete', id)

        } finally {
          this.saving = false
        }
      },
      
      async getPdf(id) {
        const pdfId = id || this.row.id
        // prefer the schema-provided endpoint (already resolved against the
        // model's real RESAAS config) over re-deriving it from safeUrl
        const endpoint = this.pdfConfig?.detail_endpoint
          ? this.pdfConfig.detail_endpoint.replace('{id}', pdfId)
          : `${this.safeUrl}/${pdfId}/pdf`

        const res = await HTTPAuthBlob.get(url({ type: 'u', url: endpoint }))
        const blob = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        this.pdf = blob
        this.showPdf = true

        if (!id) return blob
      },

      async getPdfList() {
        const endpoint = this.pdfConfig?.list_endpoint || `${this.safeUrl}/pdflist`

        const res = await HTTPAuthBlob.get(url({ type: 'u',
          url: endpoint, params: {
                page: this.pagination.page,
                page_size: this.pagination.rowsPerPage,
                search: this.search,
                ...this.filters
              }
          }
        ))
        const blob = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
        this.pdf = blob
        this.showPdf = true

      },
      
      // =========================
      // SAVE
      // =========================
      async save(options = {}) {
        const data =  this.form?.id
          ? await this.update(options)
          : await this.create()

        return data
      },

      // =========================
      // RESET FORM INTELIGENTE
      // =========================
      resetForm() {
        this.errors = {}

        if (!this.fields?.length) {
          this.form = {}
          this.row = null
          return
        }

        const newForm = {}

        this.fields.forEach(field => {
          // A read_only field (id, entity/branch, or an explicit
          // RESAAS.fields override) can never be client-supplied, so it
          // must stay unset on a brand-new record - prefilling it from
          // `default` would be actively wrong for id specifically: a
          // UUIDField's default is Django's own get_default() called
          // fresh at SCHEMA time (see app_schema.py's
          // _get_field_default()), a throwaway value with no relation
          // to whatever id the backend actually assigns at save time.
          // Setting form.id to that throwaway value made every new/add
          // form look like an edit of an existing record (isEdit checks
          // form?.id in ActionForm.vue/FormTwo.vue), hiding the Save
          // button entirely.
          if (field.read_only) return

          // `initial` is a form-only prefill hint (falls back to
          // `default` on the backend when a model declares no explicit
          // override - see app_schema.py's _schema_fields()), so it
          // takes priority over the raw model/DB default here too.
          newForm[field.name] = field.initial ?? field.default ?? null
        })

        this.form = newForm
        this.row = null
      },

      ...(extend.actions || {})
    }
  })

  if (!persistOptions) return useStore

  function usePersistedStore(pinia, hot) {
    const store = useStore(pinia, hot)
    if (!store.$persist) {
      attachPersistence(store, persistOptions, {
        identity: () => persistIdentity(store._p),
        watchIdentity: callback => watchPersistIdentity(store._p, callback),
        initialState: buildState
      })
    }
    return store
  }
  usePersistedStore.$id = useStore.$id
  return usePersistedStore
}
