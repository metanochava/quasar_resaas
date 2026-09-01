import { defineStore } from 'pinia'
import { buildFormFromSchema } from './../utils/autoForm'
import { HTTPAuth, url, HTTPAuthBlob } from '../services/api'

export function createBaseStore(name, config, extend = {}) {

  // 🔥 IMMUTABLE CONFIG (NEVER CHANGES)
  const BASE_CONFIG = Object.freeze({
    url: '' + config.app + '/' + config.model.toLowerCase() + 's',
    app: config.app,
    model: config.model
  })

  return defineStore(name, {

    // =========================
    // STATE
    // =========================
    state: () => {
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
        fields: [],
        rows: [],
        showPdf: false,
        pdf: null,
        row: null,
        form: {},

        actions: [],
        config: {},
        permissions: {},
        pdfConfig: {},

        search: '',
        filters: {},

        pagination: {
          page: 1,
          rowsPerPage: 10,
          rowsNumber: 0
        },

        ...extended
      }
    },

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
      setSearch(search) {
        this.search = search
      },

      clearSearch() {
        this.search = ''
      },

      // =========================
      // 🎯 FILTERS
      // =========================
      setFilters(filters = {}) {
        this.filters = { ...filters }
      },

      updateFilter(key, value) {
        this.filters = {
          ...this.filters,
          [key]: value
        }
      },

      removeFilter(key) {
        const newFilters = { ...this.filters }
        delete newFilters[key]
        this.filters = newFilters
      },

      clearFilters() {
        this.filters = {}
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

        this.fields = rsp?.fields || []
        this.actions = rsp?.actions || []
        this.config = rsp?.config || {}
        this.permissions = rsp?.permissions || {}
        this.pdfConfig = rsp?.pdf || {}
        this.schemaEndpoint = rsp?.schema?.model?.endpoint || null

        await this.runHook('afterSchema', this.fields)
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
      async getById(id) {
        this.assertConfig()

        await this.runHook('beforeGet', id)

        if (!id) return

        if (this.row?.id === id) return this.row

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

      // =========================
      // CREATE
      // =========================
      async create() {
        this.assertConfig()

        await this.runHook('beforeCreate', this.form)

        this.loading = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: this.safeUrl+'/' }),
            this.form
          )

          this.row = data
          this.form = { ...data }

          this.rows.unshift(data)

          await this.runHook('afterCreate', data)

          return data

        } finally {
          this.loading = false
        }
      },

      // =========================
      // UPDATE
      // =========================
      async update() {
        this.assertConfig()

        const id = this.form?.id
        if (!id) return

        await this.runHook('beforeUpdate', this.form)

        this.saving = true

        try {
          const { data } = await HTTPAuth.put(
            url({ type: 'u', url: `${this.safeUrl}/${id}/` }),
            this.form
          )

          this.row = data
          this.form = { ...data }

          const index = this.rows.findIndex(i => i.id === data.id)
          if (index !== -1) this.rows[index] = data

          await this.runHook('afterUpdate', data)

          return data

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

          this.rows = this.rows.filter(i => i.id !== id)

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
      async save() {
        const data =  this.form?.id
          ? await this.update()
          : await this.create()

        return data
      },

      // =========================
      // RESET FORM INTELIGENTE
      // =========================
      resetForm() {
        if (!this.fields?.length) {
          this.form = {}
          this.row = null
          return
        }

        const newForm = {}

        this.fields.forEach(field => {
          newForm[field.name] = field.default ?? null
        })

        this.form = newForm
        this.row = null
      },

      ...(extend.actions || {})
    }
  })
}