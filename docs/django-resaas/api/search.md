# Pesquisa Dinâmica

Todo o endpoint de listagem/detalhe de um `BaseAPIView` aceita um parâmetro de query `?search=`,
aplicado em `get_queryset()` via `build_search_query()` (`core/base/views.py`):

```text
GET /api/django_resaas/persons/?search=metano&page=1&page_size=10
```

Um `search` vazio ou ausente devolve um `Q()` vazio, que é ignorado — nunca se transforma em
`qs.filter(Q())`, o que corresponderia a filtrar por nada em vez de excluir tudo.

## Com `RESAAS.search_fields` declarado

```python
class RESAAS:
    search_fields = ["name", "surname"]
```

produz, para `?search=metano`:

```python
Q(name__icontains="metano") | Q(surname__icontains="metano")
```

Cada campo declarado é validado (`is_valid_search_field()`) antes de ser usado — um nome de campo
inválido ou mal escrito é silenciosamente ignorado em vez de levantar erro, para que um erro de
digitação em `search_fields` não parta o endpoint inteiro — apenas exclui esse campo da pesquisa,
em silêncio.

## Travessia de relações

Uma entrada de `search_fields` pode percorrer relações com `__`, desde que todos os passos exceto
o último sejam eles próprios uma relação e o passo final seja um campo `Char`/`Text`/`Email`:

```python
class RESAAS:
    search_fields = [
        "code",
        "employee__person__full_name",
    ]
```

## Sem `search_fields` (fallback automático)

Se o model não declarar `RESAAS.search_fields`, a pesquisa recorre a todos os campos
`CharField`/`TextField`/`EmailField` diretos **do próprio model** — este fallback **não** percorre
relações nem procura no nome de um objeto relacionado. Um model que precise de pesquisa através de
uma foreign key tem de declarar `search_fields` explicitamente.

## Exemplo de uso

```text
GET /api/django_resaas/persons/?search=m&page=1&page_size=10
```

Combinar com filtros e paginação — ver [Filtros, ordenação e paginação](filters-pagination.md).
