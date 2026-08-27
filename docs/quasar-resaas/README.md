# Documentação do quasar_resaas

Esta pasta contém a documentação técnica da biblioteca frontend
`quasar_resaas`, companheira do backend `django_resaas`.

## Navegação

-   [Arquitetura — Visão geral](architecture/overview.md)
-   [Arquitetura — Fluxo de dados](architecture/data-flow.md)
-   [Stores — BaseStore](stores/base-store.md)
-   [Stores — UserStore & contexto](stores/user-context.md)
-   [Componentes — Form](components/form.md)
-   [Componentes — ActionForm](components/action-form.md)
-   [Componentes — s-btn](components/button.md)
-   [Router](routing/routes.md)
-   [Layout](layout/layout.md)
-   [Permissões](features/permissions.md)
-   [Tradução](features/translation.md)
-   [API & headers](api/backend-integration.md)
-   [Public exports](api/public-exports.md)
-   [Criar um novo recurso](development/creating-resource.md)
-   [Build](deployment/build.md)
-   [Troubleshooting](troubleshooting/common-errors.md)

## Objetivo

O `quasar_resaas` fornece componentes, stores e serviços Vue3/Quasar
que lêem o schema exposto pelo `django_resaas` e geram formulários,
tabelas, filtros e fluxo CRUD sem escrever isso à mão em cada ecrã.

Esta pasta é renderizada dentro de qualquer app que instale o pacote,
através de `docsRoutes` (ver [Arquitetura](architecture/overview.md)) —
não é apenas markdown para o GitHub.
