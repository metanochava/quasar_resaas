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
<s-file v-model="doc.arquivos" multiple :camera="true" :label="tdc('Add files')" />
```

## Several files of a document (person intake form)

A document may have several files (django_resaas `DocumentFile`). The person intake
form (`PersonIntakeSections.vue`, used by add/change patient and employee) shows them
under each document's fields, centred in the card:

- the saved files (`doc.files`, from `DocumentSerializer.files`) as preview cards
  (`s-file-preview`, below); the cross on each removes it when the form is saved
  (`removedFileIds`);
- an `s-file multiple` with the camera for new files (`doc.arquivos`).

On save (`usePersonIntake.saveExisting`) a saved document sends its new files with
`Document.addFiles(id, files)` (`POST documents/{id}/files/`) and deletes the removed
ones with `Document.removeFile(id, fileId)`. A new document goes with all its files
(`Person.addDocument`, `files` repeated). The registrations build one multipart
request with `appendDocumentFiles(formData, documents)` (`stores/DocumentStore.js`):
each document lists its keys in `_file_keys`. A draft keeps the fields, never the
chosen files (a browser cannot store them).

Tests: `composables/usePersonIntake.spec.js`, `stores/DocumentStore.files.spec.js`.

## Previewing a stored file (`s-file-preview`)

`components/engine/FilePreviewCard.vue`, registered as `s-file-preview` and exported as
`FilePreviewCard`: a card with a thumbnail of what the browser can show (image, PDF,
text, video; audio plays in the card). A click opens it full screen, rendered by its
type, with "Open in a new tab" and "Download"; anything else offers the download.
It is the preview of the lab results (dev/front `FilePreviewDialog`) and of the
documents' files.

```vue
<s-file-preview :file="file" thumb-height="140px">
  <template #actions><!-- buttons on the card's name line --></template>
  <template #empty><!-- shown when there is no file --></template>
</s-file-preview>
```

`file` takes the shapes the API returns (`utils/fileKind.js`: `fileUrl`, `fileName`,
`fileKind`): a lab result / explorer item (`{file: {url, mime_type}, nome}`), a
document file (`{name, arquivo: {url, mime_type, ext}}`) or a plain `{url, name}`.
An `http` file is loaded over `https` on an `https` page.

Tests: `components/engine/FilePreviewCard.spec.js`, `utils/fileKind.spec.js`.

The camera needs HTTPS (or localhost) and the user's permission in the browser.

Tests: `components/engine/FileComponent.spec.js`.
