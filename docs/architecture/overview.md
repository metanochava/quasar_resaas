# Arquitetura do Frontend

O frontend reutilizável é construído sobre:

-   Vue 3;
-   Quasar;
-   Pinia;
-   Vue Router;
-   componentes RESAAS.

``` text
Utilizador
    |
    v
Página Vue
    |
    +--> Componentes
    |
    v
Pinia Store
    |
    v
Cliente HTTP
    |
    v
django_resaas API
```

A responsabilidade do frontend é apresentar a interface, manter estado
local e comunicar com o backend sem duplicar regras críticas de
segurança.
