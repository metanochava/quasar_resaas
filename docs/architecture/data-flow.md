# Fluxo de Dados

## Leitura

``` text
Route
  -> Page
  -> Store.getById()/list
  -> API
  -> Store.row/rows
  -> Form/Table
```

## Escrita

``` text
Utilizador
  -> Form
  -> Store.form
  -> ActionForm
  -> save()
  -> API
  -> resposta
  -> Store
  -> UI
```

## Relações

Quando um formulário depende de outra entidade, por exemplo
`Paciente.person`, a página pode carregar a `Person` correspondente e
sincronizar os dados necessários antes de guardar.
