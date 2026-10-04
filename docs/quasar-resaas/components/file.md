# s-file

`s-file` (`components/engine/FileComponent.vue`) is the RESAAS file picker. `s-field`
uses it for the schema's file and image fields; it can also be used directly.

## What it does

- A real `<input type="file">` over the "Add" button (`accept`, `multiple` passed through).
- Preview of the picked file, and of a file already stored (the backend's file object).
- Removing the value sets it back to `null` through `v-model`.
- **Use camera**: a button that opens `CameraCaptureDialog` (the device camera,
  with a choice of camera when there are several) and puts the photo in the value
  as a JPEG `File`, exactly like a picked file.

## Props

| Prop | Default | |
|---|---|---|
| `modelValue` | `null` | `File`, an array of them (`multiple`) or the stored file object |
| `label`, `hint` | — | translated with `tdc()` |
| `required`, `multiple`, `maxSize` | | |
| `error`, `errorMessage` | | backend validation error for the field |
| `camera` | `null` | the **Use camera** button: `null` shows it only when `accept` is an image type; `true` also on any other file field; `false` never |

`accept` is an attribute (from the schema's field props or given by hand).

## Taking a photo of a document

A document file usually accepts PDFs too, so the camera does not appear by
default. Ask for it with `camera` - through `s-field` as well, since the attribute
reaches `s-file`:

```vue
<s-field v-model="doc.arquivo" :field="fieldOf(Document, 'arquivo')" :label="tdc('File')" camera />
```

This is what the person intake form does for each document (`PersonIntakeSections.vue`,
used by add/change patient and employee).

The camera needs HTTPS (or localhost) and the user's permission in the browser.

Tests: `components/engine/FileComponent.spec.js`.
