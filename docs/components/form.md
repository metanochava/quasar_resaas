# Componente Form

O `Form` permite reutilizar formulários associados a stores.

Exemplo:

``` vue
<Form
  ref="pacienteFormRef"
  :store="Paciente"
  :ignoreFields="[
    'id',
    'nid',
    'person'
  ]"
/>
```

## `store`

Indica qual store fornece schema, dados e operações.

## `ignoreFields`

Remove campos que não devem ser apresentados naquele formulário.

## Refs

Quando a página precisa chamar métodos do formulário, cada `Form` deve
possuir uma ref própria. Evite utilizar a mesma ref em dois Forms
diferentes.
