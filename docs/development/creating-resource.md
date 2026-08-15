# Criar um Novo Recurso Frontend

## 1. Store

Criar uma store baseada em `createBaseStore(model)` quando o CRUD padrão
for suficiente.

## 2. Rotas

Criar as rotas list/view/add/change conforme a convenção do projeto.

## 3. Página de formulário

``` vue
<Form
  ref="formRef"
  :store="Store"
  :ignoreFields="ignoreFields"
/>

<ActionForm
  :store="Store"
  :reform="formRef"
  :buttons="['cancel', 'reset', 'edit', 'delete', 'save']"
/>
```

## 4. Página de listagem

Utilizar os componentes reutilizáveis de tabela/paginação/pesquisa.

## 5. Permissões

Garantir que as ações visuais consultam `User.can()`.

## 6. Testes manuais

Testar: - criação; - edição; - remoção; - pesquisa; - paginação; -
permissões; - mobile; - dark mode.
