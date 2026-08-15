# UserStore e Contexto da Aplicação

A store do utilizador mantém informação necessária para a experiência e
para a comunicação com o backend.

Pode incluir:

-   utilizador atual;
-   idioma;
-   entidade selecionada;
-   sucursal;
-   grupo;
-   permissões;
-   menus;
-   preferências de layout.

## Permissões

A interface pode consultar:

``` javascript
User.can('add_paciente')
```

Esta verificação controla a UI, mas não substitui a autorização no
backend.
