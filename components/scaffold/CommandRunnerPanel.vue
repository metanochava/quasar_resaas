<script setup>
import { tdc } from '../../services/translation'

// "Terminal" panel - see mega-prompt secção 16/17 and
// command_runner_service.py's own docstring for why this is a safe,
// allowlisted command runner rather than a real interactive PTY
// terminal (no PTY/WebSocket infra exists in this project today, and
// building one is a materially larger, separate piece of work).
defineProps({
  commands: { type: Array, default: () => [] },
  output: { type: String, default: '' },
  running: { type: Boolean, default: false },
})

const emit = defineEmits(['run'])
</script>

<template>
  <div class="column full-height command-runner">
    <div class="row q-gutter-xs q-pa-xs">
      <s-btn
        v-for="cmd in commands"
        :key="cmd.key"
        flat dense
        icon="play_arrow"
        :label="cmd.label"
        :loading="running"
        :disable="running"
        @click="emit('run', cmd.key)"
      >
        <q-tooltip>{{ cmd.description }}</q-tooltip>
      </s-btn>

      <div v-if="!commands.length" class="text-caption text-grey q-pa-sm">
        {{ tdc('No safe commands detected for this project') }}
      </div>
    </div>

    <q-separator />

    <pre class="col scroll command-output">{{ output || tdc('Run a command to see its output here.') }}</pre>
  </div>
</template>

<style scoped>
.command-runner {
  min-height: 0;
}

.command-output {
  margin: 0;
  padding: 8px 12px;
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 0;
  overflow-y: auto;
}
</style>
