<script setup>
import { computed, getCurrentInstance } from 'vue'
import { QForm } from 'quasar'
import { tdc } from '../../services/translation'

// The ONE visual pattern of every modal in RESAAS (the `s-modal-card`):
//
//   +--------------------------------+
//   |  q-bar   icon  Title      [x]  |   <- static header (never scrolls)
//   +--------------------------------+
//   |  body (the only part that      |   <- scrolls when it does not fit
//   |  scrolls)                      |
//   +--------------------------------+
//   |  footer / actions              |   <- static footer (only when given)
//   +--------------------------------+
//
// Use it INSIDE a <q-dialog>; never build a modal from a bare s-card. The
// header keeps the app-wide q-bar look (primary, dark in dark mode), the footer
// is as static as the header, and the height is capped so both stay reachable
// on small screens.
//
//   <q-dialog v-model="open" persistent>
//     <s-modal-card :title="tdc('Change password')" icon="key" @close="close">
//       ...body...
//       <template #footer> <s-btn .../> </template>
//     </s-modal-card>
//   </q-dialog>
//
// `form` wraps body + footer in a q-form so a submit button in the footer
// submits it (`@submit`). The close button closes the enclosing q-dialog unless
// the parent listens to `@close` (then it decides, e.g. to wipe state first) or
// `closable` is false (a step that must not be dismissed).
const props = defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  width: { type: String, default: '460px' },
  // size the card to the whole dialog (use with q-dialog full-width / full-height)
  fullscreen: { type: Boolean, default: false },
  closable: { type: Boolean, default: true },
  closeDisable: { type: Boolean, default: false },
  form: { type: Boolean, default: false },
  // remove the body padding (tables, maps, PDF viewers, ...)
  flush: { type: Boolean, default: false },
  // the footer slot lays itself out (e.g. an ActionForm bar) instead of the
  // default right-aligned row of buttons
  footerRaw: { type: Boolean, default: false },
  // the sub-header (tabs, a full-width toolbar) runs edge to edge, without padding
  subheaderFlush: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const instance = getCurrentInstance()

// the parent handles closing itself when it listens to @close
const parentCloses = computed(() => !!instance?.vnode?.props?.onClose)

const cardStyle = computed(() => props.fullscreen
  ? { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }
  : { width: props.width, minWidth: '280px', maxWidth: '96vw', maxHeight: '94vh' })
</script>

<template>
  <s-card class="s-modal-card column no-wrap" :style="cardStyle" data-test="modal-card">
    <q-bar class="s-modal-card__bar" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-primary text-white'" data-test="modal-bar">
      <q-icon v-if="icon" :name="icon" />
      <div class="ellipsis text-subtitle1 text-weight-medium" data-test="modal-title">
        <slot name="title">{{ title }}</slot>
      </div>

      <q-space />

      <slot name="bar-actions" />

      <s-btn
        v-if="closable"
        v-close-popup="!parentCloses"
        dense
        flat
        round
        icon="close"
        :aria-label="tdc('Close')"
        :disable="closeDisable"
        data-test="modal-close"
        @click="emit('close')"
      />
    </q-bar>

    <!-- static sub-header (search, filters, tabs): sits under the bar, never scrolls -->
    <div v-if="$slots.subheader" class="s-modal-card__subheader" :class="{ 's-modal-card__subheader--flush': subheaderFlush }" data-test="modal-subheader">
      <slot name="subheader" />
    </div>

    <component :is="form ? QForm : 'div'" class="s-modal-card__content column no-wrap" v-bind="form ? { onSubmit: (e) => { e?.preventDefault?.(); emit('submit', e) } } : {}">
      <div class="s-modal-card__body" :class="{ 's-modal-card__body--padded': !flush }" data-test="modal-body">
        <slot />
      </div>

      <template v-if="$slots.footer">
        <q-separator />
        <div class="s-modal-card__footer" :class="footerRaw ? '' : 'row items-center justify-end q-gutter-sm q-pa-sm'" data-test="modal-footer">
          <slot name="footer" />
        </div>
      </template>
    </component>
  </s-card>
</template>

<style scoped>
.s-modal-card { overflow: hidden; }

/* header and footer are static: only the body scrolls */
.s-modal-card__bar,
.s-modal-card__subheader { flex: 0 0 auto; }

.s-modal-card__subheader { padding: 8px 16px; }
.s-modal-card__subheader--flush { padding: 0; }

.s-modal-card__content {
  flex: 1 1 auto;
  min-height: 0;
}

.s-modal-card__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.s-modal-card__body--padded { padding: 16px; }

/* flush: the content lays itself out and fills the body (maps, viewers, tables) */
.s-modal-card__body:not(.s-modal-card__body--padded) {
  display: flex;
  flex-direction: column;
}

.s-modal-card__footer { flex: 0 0 auto; }
</style>
