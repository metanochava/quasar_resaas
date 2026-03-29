import { defineStore } from 'pinia'
import { buildFormFromSchema, HTTPAuth, url } from 'quasar_resaas'

export function createBaseStore(name, config, extend = {}) {
  return defineStore(name, {

    state: () => ({
      url: config.url,
      model: config.model,
      app: config.app,

      loading: false,

      campos: [],
      linhas: [],
      linha: null,
      form: {},

      search: '',
      filters: {},

      pagination: {
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 0,
      },

      ...(extend.state ? extend.state() : {})
    }),

    getters: {
      itemAtual: (state) => state.linha,
      lista: (state) => state.linhas,

      ...(extend.getters || {})
    },

    actions: {

      // =========================
      // 🔥 HOOK RUNNER
      // =========================
      async runHook(name, payload) {
        if (extend.hooks && typeof extend.hooks[name] === 'function') {
          return await extend.hooks[name].call(this, payload)
        }
      },

      // =========================
      // 🔥 INIT
      // =========================
      async init() {
        await this.runHook('beforeInit')

        await this.loadSchema()
        await this.loadData()

        await this.runHook('afterInit')
      },

      // =========================
      // 🔥 SCHEMA
      // =========================
      async loadSchema() {
        if (!this.app || !this.model) return

        await this.runHook('beforeSchema')

        this.campos = await buildFormFromSchema(this.app, this.model)

        await this.runHook('afterSchema', this.campos)
      },

      // =========================
      // 🔥 LIST
      // =========================
      async loadData(params = {}) {
        await this.runHook('beforeLoad')

        this.loading = true

        try {
          const { data } = await HTTPAuth.get(
            url({
              type: 'u',
              url: this.url,
              params: {
                page: this.pagination.page,
                page_size: this.pagination.rowsPerPage,
                search: this.search,
                ...this.filters,
                ...params,
              }
            })
          )

          this.linhas = data.results || data
          this.pagination.rowsNumber = data.count || this.linhas.length

          await this.runHook('afterLoad', this.linhas)

        } finally {
          this.loading = false
        }
      },

      // =========================
      // 🔥 GET BY ID
      // =========================
      async getById(id) {
        await this.runHook('beforeGet', id)

        this.loading = true

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `${this.url}/${id}/` })
          )

          this.linha = data
          this.form = { ...data }

          await this.runHook('afterGet', data)

          return data

        } finally {
          this.loading = false
        }
      },

      // =========================
      // 🔥 CREATE
      // =========================
      async create() {
        await this.runHook('beforeCreate', this.form)

        this.loading = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: this.url }),
            this.form
          )

          this.linhas.unshift(data)

          await this.runHook('afterCreate', data)

          return data

        } finally {
          this.loading = false
        }
      },

      // =========================
      // 🔥 UPDATE
      // =========================
      async update() {
        await this.runHook('beforeUpdate', this.form)

        if (!this.linha?.id) return

        this.loading = true

        try {
          const { data } = await HTTPAuth.put(
            url({ type: 'u', url: `${this.url}/${this.linha.id}/` }),
            this.form
          )

          this.linha = data

          const index = this.linhas.findIndex(i => i.id === data.id)
          if (index !== -1) this.linhas[index] = data

          await this.runHook('afterUpdate', data)

          return data

        } finally {
          this.loading = false
        }
      },

      // =========================
      // 🔥 DELETE
      // =========================
      async remove(id) {
        await this.runHook('beforeDelete', id)

        await HTTPAuth.delete(
          url({ type: 'u', url: `${this.url}/${id}/` })
        )

        this.linhas = this.linhas.filter(i => i.id !== id)

        await this.runHook('afterDelete', id)
      },

      // =========================
      // 🔥 UTIL
      // =========================
      async setSearch(search) {
        this.search = search
        this.pagination.page = 1
        await this.loadData()
      },

      async setFilters(filters) {
        this.filters = filters
        this.pagination.page = 1
        await this.loadData()
      },

      reset() {
        this.form = {}
        this.linha = null
      },

      ...(extend.actions || {})
    }
  })
}