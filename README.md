# Quasar Rest SaaS

Fernando 847213584 cell julia
Comandos de Compilacao e publicacao
npm pack
 
💎 Como usar no Wizard
🔥 simples demais
import { buildFormFromSchema } from 'quasar_ressas'

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

https://www.youtube.com/watch?v=XhV2h_rRkiY&list=RDXhV2h_rRkiY&start_radio=1