# BaseStore

A `BaseStore` fornece comportamento comum aos recursos.

## Estado típico

-   `row`: registo atual;
-   `rows`: lista de registos;
-   `form`: dados editáveis;
-   `loading`: carregamento;
-   `saving`: operação de gravação;
-   paginação;
-   filtros;
-   pesquisa.

## Ações comuns

``` text
get()
getById()
save()
delete()
resetForm()
```

## Objetivo

Um módulo simples não deve reimplementar CRUD. Deve criar a store a
partir da base e adicionar apenas lógica específica do domínio.
