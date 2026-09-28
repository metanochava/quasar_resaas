# s-modal-card

`s-modal-card` (`components/engine/ModalCard.vue`, registered globally in
`boot/components.js`) is the **one** visual pattern of every modal in RESAAS.
Use it inside a `<q-dialog>`; never build a modal from a bare `s-card` /
`q-card` with a hand-written `q-bar` and `q-card-actions`.

```
+--------------------------------+
|  q-bar   icon  Title      [x]  |   static header - never scrolls
+--------------------------------+
|  (#subheader: search, tabs)    |   optional, static
+--------------------------------+
|  body                          |   the ONLY part that scrolls
+--------------------------------+
|  #footer: actions              |   static, like the header
+--------------------------------+
```

## Usage

```vue
<q-dialog v-model="open" persistent>
  <s-modal-card :title="tdc('Change password')" icon="key" form @close="close" @submit="submit">
    <s-input v-model="form.password" type="password" :label="tdc('New password')" />

    <template #footer>
      <s-btn flat :label="tdc('Cancel')" @click="close" />
      <s-btn type="submit" color="primary" :label="tdc('Save')" />
    </template>
  </s-modal-card>
</q-dialog>
```

**Every action button goes in `#footer`**, including a stepper's Back /
Continue / Save navigation. A button left at the end of the body scrolls
away with the content: on a short screen or a long step, the user has to
scroll to find it. That breaks the pattern. For a stepper, render the
navigation of the current step in `#footer`
(`dev/front`'s `AgendaConsultaDialog.vue` is an example). Buttons that belong
to one item of a list shown in the body (e.g. "Record result" on each exam)
stay with their item.

## Props

| Prop | Default | Meaning |
|---|---|---|
| `title` | `''` | Header text (or the `#title` slot) |
| `icon` | `''` | Header icon |
| `width` | `'460px'` | Card width. Never hardcode widths in CSS: use this prop |
| `fullscreen` | `false` | Fill the dialog (with `q-dialog full-width full-height`) |
| `closable` | `true` | `false` hides the close button (a step that must not be dismissed); the `q-bar` stays |
| `close-disable` | `false` | Disable the close button while busy |
| `form` | `false` | Wrap body + footer in a `q-form`: a `type="submit"` footer button emits `@submit` |
| `flush` | `false` | No body padding (tables, maps, PDF viewers, lists with their own scroll) |
| `footer-raw` | `false` | The footer lays itself out (e.g. an `ActionForm` bar) instead of a right-aligned button row |
| `subheader-flush` | `false` | The `#subheader` runs edge to edge |

Slots: default (body), `#title`, `#subheader`, `#bar-actions` (extra header
buttons), `#footer`. Events: `close` (when listened to, the parent closes
the dialog itself), `submit` (with `form`).

## Size: header and footer always on screen

The card is capped to what the dialog leaves visible. `q-dialog` pads its
content by 24px on each side, so the card is at most
`min(94vh, calc(100vh - 48px))` tall and `min(96vw, calc(100vw - 48px))`
wide. A long body scrolls inside the card, and the header and the footer
stay visible at every screen size, including short laptop screens and phones
in landscape.

## Confirmations

Confirmations and choices use `sDialog()` (exported by `quasar_resaas`,
`services/dialog.js`) instead of Quasar's `$q.dialog()`. It takes the same
options and has the same `.onOk` / `.onCancel` / `.onDismiss` chain, and it
is rendered in this same pattern by `components/engine/DialogPrompt.vue`.

## Tests

Query a modal through its stable hooks: `modal-card`, `modal-bar`,
`modal-title`, `modal-subheader`, `modal-body`, `modal-footer`,
`modal-close`. `components/engine/ModalCard.spec.js` checks that the header
and the footer sit outside the scrolling body.

## Troubleshooting

| Symptom | Check |
|---|---|
| The buttons scroll away with the content | They are in the default slot: move them to `#footer` |
| The footer is cut off on a small screen | A hardcoded height or `max-height` in the page's CSS: remove it, use `width` / `fullscreen` |
| A modal has no header | It is not an `s-modal-card`: every modal needs the `q-bar` header, even with `:closable="false"` |
