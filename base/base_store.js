import { defineStore } from 'pinia'
import { buildFormFromSchema } from './../utils/autoForm'
import { HTTPAuth, url } from './../boot/api'

export function createBaseStore(name, config, extend = {}) {

  // 🔥 CONFIG IMUTÁVEL (NUNCA MUDA)
  const BASE_CONFIG = Object.freeze({
    url: config.url,
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
        // 🔥 CONFIG FIXA
        _config: BASE_CONFIG,

        // 🔥 DERIVADOS (nunca confiar diretamente neles)
        url: BASE_CONFIG.url,
        app: BASE_CONFIG.app,
        model: BASE_CONFIG.model,

        loading: false,

        fields: [],
        rows: [],
        row: null,
        form: {},

        actions: [],
        config: {},

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
      safeUrl: (state) => state._config.url,

      item: (state) => state.row,
      items: (state) => state.rows,

      ...(extend.getters || {})
    },

    // =========================
    // ACTIONS
    // =========================
    actions: {

      // 🔥 GUARDA DE SEGURANÇA GLOBAL
      assertConfig() {
        if (!this._config.app || !this._config.model) {
          console.error('BaseStore CONFIG ERROR:', this._config)
          throw new Error('module/model required')
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

        await this.loadSchema()
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
          module: this.safeApp,
          model: this.safeModel
        })

        this.fields = rsp?.schema || []
        this.actions = rsp?.actions || []
        this.config = rsp?.config || {}

        await this.runHook('afterSchema', this.fields)
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
            url({ type: 'u', url: this.safeUrl }),
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

        this.loading = true

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
          this.loading = false
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

        this.loading = true

        try {
          await HTTPAuth.delete(
            url({ type: 'u', url: `${this.safeUrl}/${id}/` })
          )

          this.rows = this.rows.filter(i => i.id !== id)

          this.resetForm()

          await this.runHook('afterDelete', id)

        } finally {
          this.loading = false
        }
      },

      // =========================
      // SAVE
      // =========================
      async save() {
        return this.form?.id
          ? this.update()
          : this.create()
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