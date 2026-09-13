<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { useQuasar } from 'quasar'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { markdown } from '@codemirror/lang-markdown'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { lintGutter, setDiagnostics } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'

// Thin CodeMirror 6 wrapper - the only place in the IDE that touches
// the editor library directly (mega-prompt secção 9/10: reuse one
// editor, tabs own {path, language, originalContent, currentContent,
// dirty, validationState} - that state lives in ScaffoldIDEStore, this
// component only renders ONE file's content at a time and emits
// changes back up).
const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'plaintext' },
  readOnly: { type: Boolean, default: false },
  // [{ line, column, message, severity }] - straight from the backend
  // validation response (code_validator.py), never computed here.
  diagnostics: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const container = ref(null)

let view = null
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const readOnlyCompartment = new Compartment()

function languageExtension(lang) {
  switch (lang) {
    case 'python': return python()
    case 'javascript': return javascript()
    case 'typescript': return javascript({ typescript: true })
    case 'json': return json()
    case 'css': case 'scss': return css()
    case 'vue': case 'html': return html()
    case 'markdown': return markdown()
    case 'shell': return StreamLanguage.define(shell)
    default: return []
  }
}

function toDiagnostics(state, items) {
  const doc = state.doc

  return (items || []).map(item => {
    let from = 0
    let to = 0

    if (item.line && item.line >= 1 && item.line <= doc.lines) {
      const lineInfo = doc.line(item.line)
      const col = Math.max(0, (item.column || 1) - 1)
      from = Math.min(lineInfo.from + col, lineInfo.to)
      to = lineInfo.to
    }

    return {
      from,
      to: Math.max(to, from),
      severity: item.severity === 'warning' ? 'warning' : item.severity === 'info' ? 'info' : 'error',
      message: item.message,
    }
  })
}

function applyDiagnostics() {
  if (!view) return
  view.dispatch(setDiagnostics(view.state, toDiagnostics(view.state, props.diagnostics)))
}

onMounted(() => {
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      lintGutter(),
      languageCompartment.of(languageExtension(props.language)),
      themeCompartment.of($q.dark.isActive ? [oneDark] : []),
      readOnlyCompartment.of(EditorState.readOnly.of(props.readOnly)),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
    ],
  })

  view = new EditorView({ state, parent: container.value })
  applyDiagnostics()
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

// Conteúdo trocado externamente (mudou de tab, discard, save
// confirmado) - só re-sincroniza quando o texto realmente difere do
// que o editor já tem, para não interromper o cursor a meio de escrita.
watch(() => props.modelValue, (value) => {
  if (!view) return
  if (view.state.doc.toString() === value) return

  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
  })
})

watch(() => props.language, (lang) => {
  view?.dispatch({ effects: languageCompartment.reconfigure(languageExtension(lang)) })
})

watch(() => props.readOnly, (ro) => {
  view?.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(ro)) })
})

watch(() => $q.dark.isActive, (dark) => {
  view?.dispatch({ effects: themeCompartment.reconfigure(dark ? [oneDark] : []) })
})

watch(() => props.diagnostics, applyDiagnostics, { deep: true })
</script>

<template>
  <div ref="container" class="code-editor" />
</template>

<style scoped>
.code-editor {
  height: 100%;
  overflow: auto;
  font-size: 13px;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}

.code-editor :deep(.cm-scroller) {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
</style>
