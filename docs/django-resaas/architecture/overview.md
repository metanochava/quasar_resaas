# Arquitetura do Backend

O `django_resaas` assenta num pequeno conjunto de classes base partilhadas por cima do Django/DRF,
para que cada recurso ganhe multi-tenancy, permissões, soft delete, pesquisa, filtros, paginação e
um schema legível por máquina de graça, em vez de cada app reimplementar tudo isto.

```text
Cliente / Frontend
       |
       v
 Cabeçalhos X-RESAAS-Context, L
       |
       v
TenantContextMiddleware        (architecture/middleware.md)
       |
       v
     Router                    (VIEW_REGISTRY -> build_saas_urls() - architecture/registry.md)
       |
       v
   BaseAPIView                 (api/base-api-view.md)
       |
       +---- initial(): módulo ativo? permissão concedida?  (security/permissions.md)
       +---- get_queryset(): delimitação entity/branch, ?objects=, ?search=
       |
       v
   BaseSerializer               (api/public-api-reference.md)
       |
       v
     Model                      (BaseModel / TimeModel / SoftBaseModel)
       |
       v
    Base de dados
```

## Responsabilidades

### Middleware

O `TenantContextMiddleware` descodifica o cabeçalho assinado `X-RESAAS-Context` para
`request.entity_id`/`branch_id`/`entity_type_id`/`group_id`, e o cabeçalho `L` para
`request.lang_id`, em cada pedido, antes de qualquer código de view correr. O
`FileAccessMiddleware` protege separadamente o acesso direto a ficheiros de media. Ver
[Middleware](middleware.md).

### View (`BaseAPIView`)

Recebe o pedido, confirma que o módulo do tenant está ativo e que o utilizador está autorizado
(`initial()`), constrói um queryset delimitado por tenant, opcionalmente ciente de soft delete,
opcionalmente pesquisado (`get_queryset()`), e coordena o serializer e a resposta. Ver
[BaseAPIView](../api/base-api-view.md).

### Serializer (`BaseSerializer`)

Valida os dados de entrada e transforma instâncias Django em dados no formato da API, com
`entity`/`branch`/`created_by`/`updated_by`/timestamps só de leitura por omissão. Ver
[Referência pública da API](../api/public-api-reference.md).

### Model (`BaseModel`)

Representa dados persistentes. `BaseModel` (via `TimeModel`/`SoftBaseModel`) acrescenta
delimitação por tenant, soft delete e campos de auditoria a qualquer model que o herde — ver
[Multi-tenancy](multi-tenancy.md).

### Schema (`ResaasSchemaBuilder`)

Transforma um model e os campos do seu serializer no contrato JSON declarativo Schema 1.0, que um
frontend consome para renderizar um ecrã CRUD completo sem fixar nenhuma dessas convenções do lado
do cliente. Ver [O contrato Schema 1.0](../api/schema-contract.md).

## Próximos passos

- Novo no framework: [Instalação](../getting-started/installation.md) depois
  [Início rápido](../getting-started/quick-start.md).
- Acrescentar um recurso a um projeto existente: [Criar um novo recurso](../development/creating-resource.md).
- Perceber o isolamento por tenant em profundidade: [Multi-tenancy](multi-tenancy.md) e
  [Ciclo de uma requisição](request-lifecycle.md).
