# Soft Delete, Restore e Hard Delete

Qualquer model construído sobre `SoftBaseModel` (que tanto `BaseModel` como `TimeModel` estendem)
ganha soft delete de graça, suportado por três managers: `objects` (só linhas vivas — o padrão),
`all_objects` (tudo), `deleted_objects` (só soft-deleted).

## Apagar através da API

`DELETE .../<id>/` é um **soft** delete: `perform_destroy()` define `deleted_at` (e regista
`updated_by`) em vez de remover a linha. Um `GET .../<id>/` simples numa linha soft-deleted passa
então a dar 404 — já não está no manager `objects` por omissão — mas a linha continua a existir.

## Listar além do manager por omissão

O parâmetro de query `?objects=` troca de que manager um endpoint de listagem/detalhe lê, sempre
ainda delimitado pelo tenant atual:

```text
GET .../?objects=all       # ativas + soft-deleted
GET .../?objects=deleted   # só soft-deleted
```

Trocar de manager reinicia qualquer filtragem de tenant já aplicada, e é por isso que
`get_queryset()` reaplica os filtros `entity_id`/`branch_id` logo a seguir à troca — ver
[Ciclo de uma requisição](../architecture/request-lifecycle.md).

## Restore

```text
POST .../<id>/restore/
```

Localizada através de `Model.all_objects`, filtrada por `entity_id`/`branch_id` — restaurar a
linha de outro tenant dá 404 tal como obtê-la dá. Limpa `deleted_at` e regista `updated_by`.
Exige a permissão `restore_<model>`.

## Hard delete

```text
DELETE .../<id>/hard_delete/
```

> [!WARNING]
> Remove a linha permanentemente (ignora `deleted_at` por completo) — não há `restore` que
> traga isto de volta. A mesma localização delimitada por tenant que o restore. Exige a
> permissão separada `hard_delete_<model>` — um grupo que só tenha `delete_<model>` (soft
> delete) não consegue fazer hard delete.

## Utilização direta no model

Fora da API, as mesmas operações estão disponíveis como métodos de instância:

```python
instance.delete(user=request.user)   # soft delete, regista updated_by se o model o tiver
instance.restore(user=request.user)  # limpa deleted_at, regista updated_by
instance.hard_delete()               # remoção real
```
