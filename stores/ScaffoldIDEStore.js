import { defineStore } from 'pinia'
import { HTTPAuth, url } from '../services/api'

// State for the Scaffold IDE (pages/commands/ScaffoldPage.vue) - file
// explorer/editor/validation/apply/command-runner. Deliberately
// separate from UserStore (mega-prompt secção 69: "evita sobrecarregar
// UserStore") - this is dev-tool/IDE state, never tenant/user data.
//
// The field-based Model Generator's own form state (fields, types,
// relations, extra actions...) is intentionally NOT here - it lives
// locally in components/scaffold/GeneratorPanel.vue, same as it always
// did in the old ScaffoldPage.vue. It only reaches this store's
// `openFiles` as read-only preview tabs once "Generate Preview" runs.
export const useScaffoldIDEStore = defineStore('scaffoldIDE', {
  state: () => ({
    roots: [],
    tree: {}, // { [root]: nodes[] }
    loadingTree: false,

    openFiles: [], // { root, path, language, originalContent, currentContent, dirty, hash, readOnly, validation, saving }
    activeFilePath: null,

    commands: [],
    running: false,
    output: '',

    schemaApp: null,
    schemaModel: null,
    schema: null,
    loadingSchema: false,
  }),

  getters: {
    activeFile: (state) => state.openFiles.find(f => f.path === state.activeFilePath) || null,

    dirtyFiles: (state) => state.openFiles.filter(f => f.dirty),

    // Painel "Problems" (mega-prompt secção 20) - achata os erros/
    // warnings de todos os ficheiros abertos, cada um já sabendo o seu
    // próprio path/linha.
    problems: (state) => {
      const list = []
      for (const file of state.openFiles) {
        const v = file.validation
        if (!v) continue
        for (const e of v.errors || []) list.push({ ...e, path: file.path, severity: e.severity || 'error' })
        for (const w of v.warnings || []) list.push({ ...w, path: file.path, severity: w.severity || 'warning' })
      }
      return list
    },

    errorCount() {
      return this.problems.filter(p => p.severity === 'error').length
    },
  },

  actions: {
    key(file) {
      return `${file.root}::${file.path}`
    },

    async loadRoots() {
      const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/ide/roots/', params: {} }))
      this.roots = data?.roots || []
    },

    async loadTree(root) {
      if (!root) return

      this.loadingTree = true
      try {
        const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/ide/tree/', params: { root } }))
        this.tree = { ...this.tree, [root]: data?.tree || [] }
      } finally {
        this.loadingTree = false
      }
    },

    findOpenFile(root, path) {
      const k = this.key({ root, path })
      return this.openFiles.find(f => this.key(f) === k)
    },

    async openFile(root, path) {
      const existing = this.findOpenFile(root, path)
      if (existing) {
        this.activeFilePath = existing.path
        return existing
      }

      const { data } = await HTTPAuth.get(
        url({ type: 'u', url: 'django_resaas/ide/read/', params: { root, path } })
      )

      const file = {
        root,
        path,
        language: data.language,
        originalContent: data.content,
        currentContent: data.content,
        hash: data.hash,
        dirty: false,
        readOnly: false,
        saving: false,
        validation: null,
      }

      this.openFiles.push(file)
      this.activeFilePath = path
      return file
    },

    // Usado pelo Generator (preview) - abre um ficheiro que ainda NÃO
    // existe no disco (hash=null) ou cujo conteúdo gerado ainda não foi
    // gravado, sempre "dirty" até Apply confirmar.
    openGeneratedFile(root, path, content, { readOnly = false } = {}) {
      const existing = this.findOpenFile(root, path)

      if (existing) {
        existing.currentContent = content
        existing.dirty = true
        existing.validation = null
        this.activeFilePath = path
        return existing
      }

      const file = {
        root,
        path,
        language: null,
        originalContent: '',
        currentContent: content,
        hash: null,
        dirty: true,
        readOnly,
        saving: false,
        validation: null,
      }

      this.openFiles.push(file)
      this.activeFilePath = path
      return file
    },

    setContent(path, content) {
      const file = this.openFiles.find(f => f.path === path)
      if (!file) return
      file.currentContent = content
      file.dirty = content !== file.originalContent
    },

    discardFile(path) {
      const file = this.openFiles.find(f => f.path === path)
      if (!file) return
      file.currentContent = file.originalContent
      file.dirty = false
      file.validation = null
    },

    closeFile(path) {
      this.openFiles = this.openFiles.filter(f => f.path !== path)
      if (this.activeFilePath === path) {
        this.activeFilePath = this.openFiles.at(-1)?.path || null
      }
    },

    async validateFile(path) {
      const file = this.openFiles.find(f => f.path === path)
      if (!file) return null

      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: 'django_resaas/ide/validate/', params: {} }),
        { path: file.path, content: file.currentContent }
      )

      file.validation = data
      return data
    },

    async validateAll() {
      return Promise.all(this.openFiles.map(f => this.validateFile(f.path)))
    },

    // Grava UM ficheiro já editado no IDE (não o fluxo de Apply do
    // scaffold multi-ficheiro - ver ScaffoldIDEStore's applyFiles()).
    async saveFile(path) {
      const file = this.openFiles.find(f => f.path === path)
      if (!file) return { ok: false }

      file.saving = true

      try {
        const { data } = await HTTPAuth.post(
          url({ type: 'u', url: 'django_resaas/ide/write/', params: {} }),
          {
            root: file.root,
            path: file.path,
            content: file.currentContent,
            expected_hash: file.hash,
          }
        )

        file.originalContent = file.currentContent
        file.hash = data.hash
        file.dirty = false
        file.validation = data.validation
        return { ok: true, data }
      } catch (e) {
        const response = e?.response
        if (response?.status === 422) {
          file.validation = response.data.validation
        }
        return { ok: false, error: response?.data }
      } finally {
        file.saving = false
      }
    },

    // Fluxo do Generator: valida TODOS, escreve TODOS ou nenhum.
    async applyFiles(files) {
      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: 'django_resaas/ide/apply/', params: {} }),
        { files }
      )
      return data
    },

    async loadSchema(app, model) {
      if (!app || !model) {
        this.schema = null
        return
      }

      this.schemaApp = app
      this.schemaModel = model
      this.loadingSchema = true

      try {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `django_resaas/resaasapps/${app}/${model}/schema/`, params: {} })
        )
        this.schema = data
      } finally {
        this.loadingSchema = false
      }
    },

    async loadCommands() {
      const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/ide/commands/', params: {} }))
      this.commands = data?.commands || []
    },

    async runCommand(key) {
      this.running = true
      this.output = ''

      try {
        const { data } = await HTTPAuth.post(
          url({ type: 'u', url: 'django_resaas/ide/run/', params: {} }),
          { key }
        )
        this.output = [data.stdout, data.stderr].filter(Boolean).join('\n')
        return data
      } finally {
        this.running = false
      }
    },
  },
})
