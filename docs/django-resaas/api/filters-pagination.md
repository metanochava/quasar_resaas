# Filtros, Ordenação e Paginação

## Filtros

A filtragem é **totalmente automática** — não há `filterset_fields` para declarar por view. O
`DynamicFilterBackend` (`core/base/views.py`) constrói um `django_filters.FilterSet` em tempo de
pedido, a partir de todos os campos do model **exceto** `FileField`/`ImageField`, usando
correspondência exata:

```text
GET /api/hr/employees/?state=Active
```

Qualquer campo do model é filtrável desta forma assim que o model existe — incluindo foreign keys
(pelo seu id) e booleanos/datas por valor exato. Não há nenhuma configuração ou opt-in por model.

## Combinar com pesquisa

Pesquisa (`?search=`) e filtros combinam-se livremente — a pesquisa é aplicada como um `Q()`
adicional sobre o que quer que `DynamicFilterBackend`/`DjangoFilterBackend` já tenha filtrado:

```text
GET /api/hr/employees/?search=dias&state=Active&page=1&page_size=10
```

## Ordenação

`ordering_fields = "__all__"` está definido em `BaseAPIView`, pelo que qualquer campo do model
pode ser usado com o parâmetro de query padrão do `OrderingFilter` do DRF:

```text
GET /api/hr/employees/?ordering=-created_at
```

## Paginação

`ResaasPagination` (uma subclasse de `PageNumberPagination`) é a classe de paginação por omissão:

- `page` — número da página.
- `page_size` — linhas por página. Por omissão `10` (`REST_FRAMEWORK["PAGE_SIZE"]`), limitado a
  `max_page_size = 1000`. Um model pode sobrepor o seu próprio valor por omissão via
  `RESAAS.pagination` — ver [Models & RESAAS](../models/resaas-config.md).
- `page_size=0` é um caso especial: desativa a paginação por completo para esse pedido e devolve
  todas as linhas correspondentes numa única resposta, ainda com a forma de uma resposta paginada
  (`{"count", "next": null, "previous": null, "results"}`) para que o cliente não precise de um
  caminho de código separado. Usar com moderação — ignora o limite de tamanho de página.

O envelope da resposta (`count`/`next`/`previous`/`results`) é sempre a forma padrão do
`PageNumberPagination` do DRF, incluindo no caso `page_size=0` acima. Ver
[O contrato Schema 1.0](schema-contract.md#forma) para como os valores por omissão efetivos de
paginação de um model (`page_size`, `page_size_options`, `default_ordering`) são expostos a um
frontend sem que este precise de conhecer nada do que foi dito acima.
