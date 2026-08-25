# Quasar Rest SaaS

Comandos de Compilacao e publicacao
npm pack

💎 Como usar no Wizard
import { buildFormFromSchema } from 'quasar_resaas'

const fields = ref([])
const formModel = ref({})

async function loadSchema() {
  fields.value = await buildFormFromSchema('rh', 'Funcionario')
}

template
<AutoForm
  :fields="fields"
  :model="formModel"
/>
