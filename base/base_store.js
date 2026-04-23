import { defineStore } from 'pinia'
import { buildFormFromSchema } from './../utils/autoForm'
import { HTTPAuth, url } from './../boot/api'

export function createBaseStore(name, config, extend = {}) {
  return defineStore(name, {

    // =========================
    // STATE
    // =========================
    state: () => ({
      url: config.url,
      model: config.model,
      app: config.app,

      loading: false,

      fields: [],
      rows: [],
      row: null,
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

    // =========================
    // GETTERS
    // =========================
    getters: {
      item: (state) => state.row,
      items: (state) => state.rows,

      ...(extend.getters || {})
    },

    // =========================
    // ACTIONS
    // =========================
    actions: {

      // =========================
      // HOOK RUNNER
      // =========================
      async runHook(name, payload) {
        if (extend.hooks && typeof extend.hooks[name] === 'function') {
          return await extend.hooks[name].call(this, payload)
        }
      },

      // =========================
      // INIT
      // =========================
      async init() {
        await this.runHook('beforeInit')

        await this.loadSchema()
        await this.loadData()

        await this.runHook('afterInit')
      },

      // =========================
      // SCHEMA
      // =========================
      async loadSchema() {
        if (!this.app || !this.model) return

        await this.runHook('beforeSchema')
        
        // {'schema': out, 'actions': actions, 'config': config }
        const rsp = await buildFormFromSchema(this.app, this.model)

        this.fields = rsp.schema

        await this.runHook('afterSchema', this.fields)
      },

      // =========================
      // LIST
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

          this.rows = data.results || data
          this.pagination.rowsNumber = data.count || this.rows.length

          await this.runHook('afterLoad', this.rows)

        } catch (e) {
          console.error('loadData error', e)
        } finally {
          this.loading = false
        }
      },

      // =========================
      // GET BY ID
      // =========================
      async getById(id) {
        await this.runHook('beforeGet', id)

        if (!id) return

        // evita request duplicado
        if (this.row?.id === id) return this.row

        this.loading = true

        try {
          const { data } = await HTTPAuth.get(
            url({ type: 'u', url: `${this.url}/${id}/` })
          )

          this.row = data
          this.form = { ...data }

          await this.runHook('afterGet', data)

          return data

        } catch (e) {
          console.error('getById error', e)
          this.resetForm()
          throw e

        } finally {
          this.loading = false
        }
      },

      // =========================
      // CREATE
      // =========================
      async create() {
        await this.runHook('beforeCreate', this.form)

        this.loading = true

        try {
          const { data } = await HTTPAuth.post(
            url({ type: 'u', url: this.url }),
            this.form
          )

          this.row = data
          this.form = { ...data }

          this.rows.unshift(data)

          await this.runHook('afterCreate', data)

          return data

        } catch (e) {
          console.error('create error', e)
          throw e

        } finally {
          this.loading = false
        }
      },

      // =========================
      // UPDATE
      // =========================
      async update() {
        await this.runHook('beforeUpdate', this.form)

        const id = this.form?.id
        if (!id) return

        this.loading = true

        try {
          const { data } = await HTTPAuth.put(
            url({ type: 'u', url: `${this.url}/${id}/` }),
            this.form
          )

          this.row = data
          this.form = { ...data }

          const index = this.rows.findIndex(i => i.id === data.id)
          if (index !== -1) this.rows[index] = data

          await this.runHook('afterUpdate', data)

          return data

        } catch (e) {
          console.error('update error', e)
          throw e

        } finally {
          this.loading = false
        }
      },

      // =========================
      // DELETE
      // =========================
      async remove() {
        const id = this.form?.id
        if (!id) return

        await this.runHook('beforeDelete', id)

        this.loading = true

        try {
          await HTTPAuth.delete(
            url({ type: 'u', url: `${this.url}/${id}/` })
          )

          this.rows = this.rows.filter(i => i.id !== id)

          this.resetForm()

          await this.runHook('afterDelete', id)

          return true

        } catch (e) {
          console.error('delete error', e)
          throw e

        } finally {
          this.loading = false
        }
      },

      // =========================
      // SAVE (INTELIGENTE)
      // =========================
      async save() {
        if (this.form?.id) {
          return await this.update()
        }
        return await this.create()
      },

      // =========================
      // SEARCH
      // =========================
      async setSearch(search) {
        this.search = search
        this.pagination.page = 1
        await this.loadData()
      },

      // =========================
      // FILTERS
      // =========================
      async setFilters(filters) {
        this.filters = filters
        this.pagination.page = 1
        await this.loadData()
      },

      // =========================
      // RESET FORM (INTELIGENTE)
      // =========================
      resetForm() {
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