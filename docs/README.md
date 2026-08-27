# Documentação

Este site de documentação cobre **dois produtos separados**, servidos
pela mesma UI (`docsRoutes` / `DocsPage.vue`), com um seletor de
produto no topo da barra lateral:

- **[quasar_resaas](quasar-resaas/README.md)** — a biblioteca
  frontend Vue 3 + Quasar (este pacote).
- **[django_resaas](django-resaas/README.md)** — o framework backend
  Django/DRF que ela consome.

Cada produto tem a sua própria árvore de ficheiros e navegação
(`docsNav['quasar-resaas']` / `docsNav['django-resaas']`, definidos em
[`router/docsRoutes.js`](../router/docsRoutes.js)), mas ambos são
lidos e renderizados pela mesma página (`pages/docs/DocsPage.vue`),
com o mesmo estilo — inspirado na documentação oficial do Quasar
Framework (seletor de secção, sidebar agrupada, índice "On this page").

Ver [Arquitetura do quasar_resaas](quasar-resaas/architecture/overview.md)
para como isto é montado dentro de uma app hospedeira.
