# 🧠 Guia de Uso - BaseStore (Pinia + django_resaas)

Este documento explica como usar o **BaseStore Enterprise** criado com Pinia para construir stores reutilizáveis em qualquer módulo do sistema (Clínica, RH, Faturamento, etc.).

---

# 🚀 1. O que é o BaseStore?

O `BaseStore` é um gerador de stores que:

* Evita duplicação de código
* Padroniza CRUD
* Integra com `django_resaas`
* Suporta hooks (antes/depois de ações)
* Permite extensão por módulo

---

# 📦 2. Criando um Store

## Exemplo: Paciente

```js
import { createBaseStore } from 'src/stores/BaseStore'

export const usePacienteStore = createBaseStore('paciente', {
  url: 'ipa/clinica/pacientes',
  app: 'clinica',
  model: 'Paciente'
})
```



---

# 🧩 3. Usando no Vue

```js
import { usePacienteStore } from 'src/stores/paciente'

const store = usePacienteStore()

onMounted(async () => {
  await store.init()
})
```

---

# 🔥 4. Funcionalidades disponíveis

## 📌 Listar dados

```js
await store.loadData()
```

## 📌 Buscar por ID

```js
await store.getById(1)
```

## 📌 Criar

```js
store.form = { nome: 'Maria' }
await store.create()
```

## 📌 Atualizar

```js
await store.update()
```

## 📌 Remover

```js
await store.remove(id)
```

---

# 🔍 5. Filtros e pesquisa

```js
await store.setSearch('Maria')
await store.setFilters({ estado: true })
```

---

# 📄 6. Paginação

```js
await store.setPage(2)
await store.setRowsPerPage(20)
```

---

# 🧠 7. Hooks (Enterprise)

Os hooks permitem executar lógica antes/depois das ações.

## Exemplo:

```js
export const usePacienteStore = createBaseStore(
  'paciente',
  { url: 'ipa/clinica/pacientes', app: 'clinica', model: 'Paciente' },
  {
    hooks: {
      beforeLoad() {
        console.log('Carregando...')
      },

      afterLoad(data) {
        console.log('Carregado:', data.length)
      },

      beforeCreate(form) {
        form.created_at = new Date()
      }
    }
  }
)
```

---

# ⚙️ 8. Personalizando Store

## Exemplo com ações extras

```js
export const usePacienteStore = createBaseStore(
  'paciente',
  {
    url: 'ipa/clinica/pacientes',
    app: 'clinica',
    model: 'Paciente'
  },
  {
    state: () => ({
      timeline: []
    }),

    actions: {
      async loadDashboard(id) {
        const { data } = await HTTPAuth.get(
          url({ type: 'u', url: `${this.url}/${id}/dashboard/` })
        )

        this.linha = data.paciente
        this.timeline = data.timeline
      }
    }
  }
)
```

---

# 🧠 9. Getters

```js
getters: {
  ativo: (state) => state.linha?.estado === true
}
```

---

# 🏗️ 10. Estrutura recomendada

```
src/
 ├── stores/
 │   ├── BaseStore.js
 │   ├── paciente.js
 │   ├── funcionario.js
 │   └── exames.js
```

---

# 🔐 11. Multi-clínica

⚠️ Não precisa tratar no store.

✔ O `HTTPAuth` já injeta o tenant automaticamente.

---

# 💎 12. Boas práticas

✔ Nunca duplicar store
✔ Sempre usar BaseStore
✔ Separar lógica por módulo
✔ Usar hooks para lógica específica
✔ Manter store limpo (sem UI)

---

# 🚀 13. Próximos passos

<<<<<<< HEAD
- AutoCrud dinâmico
- Cache inteligente
- Permissões automáticas
- Offline support
=======
* AutoCrud dinâmico
* Cache inteligente
* Permissões automáticas
* Offline support
>>>>>>> temp-release

---

# 🏁 Conclusão

O BaseStore é o **core do frontend SaaS**.

Com ele você consegue:

<<<<<<< HEAD
- Criar módulos rapidamente
- Padronizar sistema inteiro
- Escalar para múltiplas clínicas

🔥 Isso é arquitetura de produto real.

=======
* Criar módulos rapidamente
* Padronizar sistema inteiro
* Escalar para múltiplas clínicas

🔥 Isso é arquitetura de produto real.
>>>>>>> temp-release
