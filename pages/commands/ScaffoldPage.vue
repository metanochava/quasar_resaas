<template>
  <q-page class="scaffold-ide column no-wrap">

    <ScaffoldToolbar
      :apps="apps"
      :selected-app="ide.schemaApp"
      :models="models"
      :selected-model="ide.schemaModel"
      :active-file="ide.activeFile"
      :error-count="ide.errorCount"
      :dirty-count="ide.dirtyFiles.length"
      :saving="!!ide.activeFile?.saving"
      @update:selected-app="onSelectApp"
      @update:selected-model="onSelectModel"
      @validate="validateActive"
      @save="saveActive"
      @discard="discardActive"
      @refresh="refreshAll"
      @toggle-generator="showGenerator = !showGenerator"
    />

    <!-- MOBILE: explorer/inspector become drawers -->
    <div class="row items-center q-gutter-xs q-px-sm q-py-xs gt-xs-hide lt-md" v-if="$q.screen.lt.md">
      <s-btn flat dense icon="folder" :label="tdc('Explorer')" @click="leftDrawer = true" />
      <s-btn flat dense icon="info" :label="tdc('Inspector')" @click="rightDrawer = true" />
    </div>

    <q-splitter v-model="verticalSplit" horizontal class="col ide-splitter" :limits="[30, 85]">
      <template #before>
        <q-splitter v-model="horizontalSplit" class="full-height" :limits="[0, 40]">
          <template #before>
            <ProjectExplorer
              v-if="$q.screen.gt.sm"
              class="full-height"
              :roots="ide.roots"
              :selected-root="selectedRoot"
              :tree="ide.tree[selectedRoot] || []"
              :loading="ide.loadingTree"
              :active-path="ide.activeFilePath"
              @update:selected-root="onSelectRoot"
              @open="openFile"
            />
          </template>

          <template #after>
            <q-splitter v-model="editorSplit" reverse class="full-height" :limits="[0, 40]">
              <template #before>
                <div class="column full-height editor-area">
                  <q-tabs
                    v-if="ide.openFiles.length"
                    v-model="ide.activeFilePath"
                    dense inline-label align="left" class="editor-tabs"
                  >
                    <q-tab
                      v-for="f in ide.openFiles" :key="f.path" :name="f.path"
                      class="editor-tab"
                    >
                      <div class="row items-center no-wrap q-gutter-xs">
                        <span class="ellipsis" style="max-width: 140px">{{ fileLabel(f.path) }}</span>
                        <span v-if="f.dirty" class="dirty-dot">●</span>
                        <q-icon name="close" size="14px" @click.stop="requestClose(f.path)" />
                      </div>
                    </q-tab>
                  </q-tabs>

                  <q-separator v-if="ide.openFiles.length" />

                  <CodeEditor
                    v-if="ide.activeFile"
                    class="col"
                    :model-value="ide.activeFile.currentContent"
                    :language="ide.activeFile.language || 'plaintext'"
                    :read-only="ide.activeFile.readOnly"
                    :diagnostics="[...(ide.activeFile.validation?.errors || []), ...(ide.activeFile.validation?.warnings || [])]"
                    @update:model-value="v => ide.setContent(ide.activeFile.path, v)"
                  />

                  <div v-else class="col flex flex-center text-grey editor-empty">
                    <div class="text-center">
                      <q-icon name="description" size="48px" />
                      <div class="q-mt-sm">{{ tdc('Select a file or generate a scaffold') }}</div>
                    </div>
                  </div>
                </div>
              </template>

              <template #after>
                <SchemaInspector
                  v-if="$q.screen.gt.sm"
                  class="full-height"
                  :schema="ide.schema"
                  :loading="ide.loadingSchema"
                />
              </template>
            </q-splitter>
          </template>
        </q-splitter>
      </template>

      <template #after>
        <q-tabs v-model="bottomTab" dense align="left">
          <q-tab name="problems" :label="`${tdc('Problems')} (${ide.problems.length})`" />
          <q-tab name="commands" :label="tdc('Commands')" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="bottomTab" class="bottom-panels">
          <q-tab-panel name="problems" class="q-pa-none">
            <ProblemsPanel :problems="ide.problems" @open="onOpenProblem" />
          </q-tab-panel>
          <q-tab-panel name="commands" class="q-pa-none full-height">
            <CommandRunnerPanel
              :commands="ide.commands" :output="ide.output" :running="ide.running"
              @run="ide.runCommand"
            />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>

    <!-- MOBILE DRAWERS -->
    <q-drawer v-model="leftDrawer" side="left" overlay>
      <ProjectExplorer
        :roots="ide.roots" :selected-root="selectedRoot" :tree="ide.tree[selectedRoot] || []"
        :loading="ide.loadingTree" :active-path="ide.activeFilePath"
        @update:selected-root="onSelectRoot"
        @open="(p) => { openFile(p); leftDrawer = false }"
      />
    </q-drawer>

    <q-drawer v-model="rightDrawer" side="right" overlay>
      <SchemaInspector :schema="ide.schema" :loading="ide.loadingSchema" />
    </q-drawer>

    <!-- GENERATOR -->
    <q-dialog v-model="showGenerator" maximized>
      <GeneratorPanel @close="showGenerator = false" @applied="onGenerated" />
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { tdc } from '../../services/translation'
import { HTTPAuth, url } from '../../services/api'
import { useScaffoldIDEStore } from '../../stores/ScaffoldIDEStore'

import ScaffoldToolbar from '../../components/scaffold/ScaffoldToolbar.vue'
import ProjectExplorer from '../../components/scaffold/ProjectExplorer.vue'
import SchemaInspector from '../../components/scaffold/SchemaInspector.vue'
import ProblemsPanel from '../../components/scaffold/ProblemsPanel.vue'
import CommandRunnerPanel from '../../components/scaffold/CommandRunnerPanel.vue'
import CodeEditor from '../../components/scaffold/CodeEditor.vue'
import GeneratorPanel from '../../components/scaffold/GeneratorPanel.vue'
import { sDialog } from '../../services/dialog'

// Scaffold IDE (mega-prompt: "ScaffoldPage.vue deve deixar de ser
// apenas uma página de comandos e passar a funcionar como um IDE
// integrado"). Composition-only - every real capability (tree/read/
// validate/write/apply/commands, schema, generator form) lives in
// ScaffoldIDEStore + components/scaffold/* (mega-prompt secção 70:
// "não colocar tudo em ScaffoldPage.vue").
const ide = useScaffoldIDEStore()

const apps = ref([])
const models = ref([])
const selectedRoot = ref(null)

const verticalSplit = ref(78)
const horizontalSplit = ref(18)
const editorSplit = ref(22)
const bottomTab = ref('problems')

const leftDrawer = ref(false)
const rightDrawer = ref(false)
const showGenerator = ref(false)

function fileLabel(path) {
  return path.split('/').pop()
}

async function loadApps() {
  const { data } = await HTTPAuth.get(url({ type: 'u', url: 'django_resaas/resaasapps/', params: {} }))
  apps.value = data?.apps || []
}

async function onSelectRoot(root) {
  selectedRoot.value = root
  await ide.loadTree(root)
}

async function onSelectApp(app) {
  ide.schemaApp = app
  models.value = []
  ide.schemaModel = null
  ide.schema = null

  if (!app) return

  const { data } = await HTTPAuth.get(url({ type: 'u', url: `django_resaas/resaasapps/${app}/`, params: {} }))
  models.value = data?.models || []

  // Se este app também for um workspace root válido, já mostra a
  // árvore de ficheiros correspondente - poupa um segundo clique.
  if (ide.roots.some(r => r.key === app)) {
    onSelectRoot(app)
  }
}

async function onSelectModel(model) {
  ide.schemaModel = model
  if (ide.schemaApp && model) {
    await ide.loadSchema(ide.schemaApp, model)
  }
}

async function openFile(path) {
  if (!selectedRoot.value) return
  await ide.openFile(selectedRoot.value, path)
}

function requestClose(path) {
  const file = ide.openFiles.find(f => f.path === path)
  if (!file) return

  if (!file.dirty) {
    ide.closeFile(path)
    return
  }

  sDialog({
    title: tdc('Unsaved changes'),
    message: tdc('"{name}" has unsaved changes.').replace('{name}', fileLabel(path)),
    cancel: true,
    persistent: true,
    options: {
      type: 'radio',
      model: 'save',
      items: [
        { label: tdc('Save'), value: 'save' },
        { label: tdc('Discard'), value: 'discard' },
      ],
    },
  }).onOk(async (choice) => {
    if (choice === 'save') {
      const result = await ide.saveFile(path)
      if (!result.ok) return
    }
    ide.closeFile(path)
  })
}

async function validateActive() {
  if (ide.activeFilePath) await ide.validateFile(ide.activeFilePath)
}

async function saveActive() {
  if (!ide.activeFilePath) return
  await ide.validateFile(ide.activeFilePath)
  if (ide.errorCount > 0) return
  await ide.saveFile(ide.activeFilePath)
}

function discardActive() {
  if (ide.activeFilePath) ide.discardFile(ide.activeFilePath)
}

function onOpenProblem(path) {
  ide.activeFilePath = path
}

async function refreshAll() {
  if (selectedRoot.value) await ide.loadTree(selectedRoot.value)
  if (ide.schemaApp && ide.schemaModel) await ide.loadSchema(ide.schemaApp, ide.schemaModel)
}

async function onGenerated({ app }) {
  showGenerator.value = false
  if (selectedRoot.value === app) {
    await ide.loadTree(app)
  }
}

// Validação ao vivo do ficheiro activo enquanto se escreve seria
// "validar em cada tecla" (mega-prompt secção 22 explicitamente contra
// isso) - por isso não há um watch aqui a chamar validateFile() a cada
// alteração; validação corre em Validate/Save (ver toolbar) e,
// automaticamente, dentro de saveActive() antes de gravar.

onMounted(async () => {
  await Promise.all([loadApps(), ide.loadRoots(), ide.loadCommands()])
})
</script>

<style scoped>
/* Regra geral desta página: um "col" dentro de um flex column nunca
   encolhe abaixo da altura do seu próprio conteúdo por omissão
   (min-height:auto do flexbox) - sem min-height:0 explícito em CADA
   nível, o "scroll" (overflow:auto) dos 3 painéis (explorer/editor/
   inspector) nunca chega a activar-se e é a PÁGINA inteira que cresce
   e ganha scroll, em vez de cada painel scrollar internamente. */
.scaffold-ide {
  height: 100%;
  min-height: 0;
}

.ide-splitter {
  min-height: 0;
}

.editor-area {
  min-width: 0;
  min-height: 0;
}

.editor-area > .col {
  min-height: 0;
}

.editor-tabs {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.editor-tab {
  text-transform: none;
}

.dirty-dot {
  color: var(--q-warning, #f2c037);
  font-size: 10px;
}

.editor-empty {
  height: 100%;
}

.bottom-panels {
  height: calc(100% - 36px);
}
</style>
