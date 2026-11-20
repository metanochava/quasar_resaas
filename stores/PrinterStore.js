import { createBaseStore } from '../base/base_store'

// Generic list/CRUD of Printer
// (django_resaas.saas.models.printer.Printer) - a Branch's printers and the documents each prints by default.
export const usePrinterStore = createBaseStore(
  'printer',
  {
    app: 'django_resaas',
    model: 'Printer'
  }
)
