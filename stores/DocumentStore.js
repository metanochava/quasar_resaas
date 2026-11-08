import { createBaseStore } from '../base/base_store'
import { HTTPAuth, url } from '../services/api'

// Document belongs to whatever content_object it points at (Person
// today, via Person.documents - see saas/models/document.py) - reading/
// writing individual rows still goes through the generic documents/
// endpoint like any other model; the add_employee flow itself creates
// new documents through the atomic hr/employees/register/ action
// instead (see EmployeeStore.register()), never through this store's
// own create(), so a new Document's content_type/object_id is always
// resolved server-side, never supplied by the frontend.
export const useDocumentStore = createBaseStore('document', {
  app: 'django_resaas',
  model: 'Document'
}, {
  actions: {
    // A document may have several files (DocumentFile): the sub-resource
    // documents/{id}/files/ (DocumentAPIView.files / remove_file).
    async addFiles(documentId, files) {
      const list = (files || []).filter(f => f instanceof File)
      if (!documentId || !list.length) return null
      const body = new FormData()
      list.forEach(file => body.append('files', file))
      const { data } = await HTTPAuth.post(
        url({ type: 'u', url: `django_resaas/documents/${documentId}/files/` }),
        body
      )
      return data
    },

    async removeFile(documentId, fileId) {
      if (!documentId || !fileId) return
      await HTTPAuth.delete(url({ type: 'u', url: `django_resaas/documents/${documentId}/files/${fileId}/` }))
    }
  }
})

// The registration actions (saude/pacientes/register, hr/employees/register)
// send one multipart request: a JSON payload plus every document file under
// its own key. Each document lists its keys in _file_keys (a document may
// have several files, doc.arquivos); the backend reads them with
// person_registration_service.documents_with_files.
export function appendDocumentFiles(formData, documents) {
  return (documents || []).map((doc, index) => {
    // eslint-disable-next-line no-unused-vars
    const { arquivo, arquivos, files, removedFileIds, ...rest } = doc || {}
    const list = [...(arquivos || []), ...(arquivo instanceof File ? [arquivo] : [])].filter(f => f instanceof File)
    const keys = list.map((file, n) => {
      const key = `document_file_${index}_${n}`
      formData.append(key, file)
      return key
    })
    return { ...rest, _file_keys: keys }
  })
}
