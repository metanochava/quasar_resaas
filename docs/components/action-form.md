# ActionForm

O `ActionForm` centraliza os botões de ação.

Exemplo:

``` vue
<ActionForm
  :store="Paciente"
  :reform="pacienteFormRef"
  :buttons="[
    'cancel',
    'reset',
    'edit',
    'save'
  ]"
/>
```

## Ações

-   `cancel`: cancelar;
-   `reset`: repor formulário;
-   `edit`: guardar alterações;
-   `delete`: apagar;
-   `save`: criar.

## Permissões

Os botões podem depender de:

``` javascript
User.can('change_' + store.model.toLowerCase())
User.can('delete_' + store.model.toLowerCase())
User.can('add_' + store.model.toLowerCase())
```
