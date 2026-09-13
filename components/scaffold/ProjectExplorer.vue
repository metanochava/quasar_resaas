<script setup>
import { computed } from 'vue'
import { tdc } from '../../services/translation'

// File tree panel (mega-prompt secção 13/100) - purely presentational,
// built from IDEWorkspaceAPIView.tree()'s already-restricted response
// (workspace_service.list_tree() - only real, allowed roots ever
// appear here, never an arbitrary server path). Uses Quasar's own
// QTree instead of a hand-rolled recursive component (secção 7:
// prefer existing components).
const props = defineProps({
  roots: { type: Array, default: () => [] },
  selectedRoot: { type: String, default: null },
  tree: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activePath: { type: String, default: null },
})

const emit = defineEmits(['update:selectedRoot', 'open'])

const LANGUAGE_ICONS = {
  python: 'data_object',
  vue: 'widgets',
  javascript: 'javascript',
  typescript: 'javascript',
  json: 'data_object',
  css: 'css',
  scss: 'css',
  markdown: 'description',
  shell: 'terminal',
}

function fileIcon(name) {
  const ext = name.includes('.') ? name.split('.').pop() : ''
  const byExt = {
    py: 'python', vue: 'vue', js: 'javascript', ts: 'javascript',
    json: 'json', css: 'css', scss: 'css', md: 'markdown', sh: 'shell',
  }[ext]
  return LANGUAGE_ICONS[byExt] || 'description'
}

function toQTree(nodes) {
  return (nodes || []).map(node => {
    if (node.type === 'directory') {
      return {
        label: node.name,
        icon: 'folder',
        path: node.path,
        selectable: false,
        children: toQTree(node.children),
      }
    }

    return {
      label: node.name,
      icon: node.denied ? 'lock' : fileIcon(node.name),
      path: node.path,
      isFile: true,
      denied: node.denied,
      selectable: !node.denied,
    }
  })
}

const qTreeNodes = computed(() => toQTree(props.tree))

function onNodeClick(node) {
  if (!node.isFile || node.denied) return
  emit('open', node.path)
}
</script>

<template>
  <div class="column full-height explorer">
    <div class="q-pa-sm">
      <s-select
        :model-value="selectedRoot"
        :options="roots"
        option-value="key"
        option-label="label"
        emit-value
        map-options
        :label="tdc('App / Module')"
        @update:model-value="v => emit('update:selectedRoot', v)"
      />
    </div>

    <q-separator />

    <div class="col scroll q-pa-xs">
      <div v-if="loading" class="flex flex-center q-pa-lg">
        <q-spinner size="28px" color="primary" />
      </div>

      <q-tree
        v-else-if="qTreeNodes.length"
        :nodes="qTreeNodes"
        node-key="path"
        :selected="activePath"
        default-expand-all
        dense
        @update:selected="() => {}"
      >
        <template #default-header="scope">
          <div
            class="row items-center q-gutter-xs explorer-node"
            :class="{ 'explorer-node--active': scope.node.path === activePath, 'explorer-node--denied': scope.node.denied }"
            @click="onNodeClick(scope.node)"
          >
            <q-icon :name="scope.node.icon" size="16px" />
            <span>{{ scope.node.label }}</span>
            <q-tooltip v-if="scope.node.denied">{{ tdc('This file cannot be opened by the IDE') }}</q-tooltip>
          </div>
        </template>
      </q-tree>

      <div v-else class="text-caption text-grey q-pa-md">
        {{ tdc('Select a module to browse its files') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.explorer-node {
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 4px;
}

.explorer-node:hover {
  background: rgba(128, 128, 128, 0.12);
}

.explorer-node--active {
  background: rgba(25, 118, 210, 0.14);
  font-weight: 600;
}

.explorer-node--denied {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
