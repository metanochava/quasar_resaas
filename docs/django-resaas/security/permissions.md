# Permissões

O backend é a autoridade final para autorização.

## Processo

1. Identificar a action da view.
2. Converter a action num prefixo de permissão.
3. Obter o nome técnico do model.
4. Construir o codename.
5. Verificar com `isPermited()`.

Exemplo:

```text
create + patient -> add_patient
update + patient -> change_patient
destroy + patient -> delete_patient
```

## Cache

Uma cache por pedido evita verificações repetidas do mesmo codename durante o mesmo pedido.

## Módulo

Além da própria permissão, a aplicação verifica se o módulo correspondente está ativo para a
entidade (ver [`../api/base-api-view.md`](../api/base-api-view.md)).

## Permissões de actions personalizadas e ownership

Métodos `@resaas_action` ganham a sua própria `Permission`, sincronizada pelo `ActionSyncService`
para dentro de `ModelExtraAction`. Dois campos decidem o que o mecanismo de sincronização pode e
não pode tocar:

- **`managed_by`** (`"decorator"` ou `"manual"`, por omissão `"manual"`) — identifica *quem* é
  dono de uma linha `ModelExtraAction`. O `ActionSyncService` escreve sempre `managed_by="decorator"`
  para linhas que cria/atualiza a partir de um `@resaas_action`. Uma linha criada de qualquer outra
  forma (admin, migração de dados, diretamente na shell) fica por omissão `"manual"` e passa então
  a estar **fora do alcance do decorator**: se um `@resaas_action` for declarado com a mesma
  identidade `app`/`model`/`action` de uma linha `managed_by="manual"` já existente, sincronizar
  levanta `ImproperlyConfigured` em vez de a tomar silenciosamente. Para entregar uma action manual
  ao decorator de propósito, definir `managed_by="decorator"` nessa linha primeiro.
- **`permission_managed`** (booleano, por omissão `False`) — se a *própria Permission* (não só a
  linha `ModelExtraAction`) foi criada pelo RESAAS e é por isso segura para apagar automaticamente
  assim que a sua action ficar órfã (removida do código). Uma `Permission` já existente (criada
  por um humano, ex. via admin) é detetada no momento da sincronização e marcada
  `permission_managed=False`, pelo que a limpeza de órfãos remove a linha `ModelExtraAction` mas
  **nunca** a `Permission`. Uma `Permission` criada via um `@resaas_action(permission=...)`
  explícito (pensada para ser partilhada/reutilizada entre actions) também nunca é apagada na
  limpeza, e o seu `.name` nunca é renomeado automaticamente — só uma permissão que segue a
  convenção por omissão `{action}_{model}` tem o `.name` mantido em sincronia com o label/model da
  action automaticamente.

> [!NOTE]
> A remoção de órfãos só acontece em `ActionSyncService.sync_registry()` (o ponto de entrada
> do sinal `post_migrate` / `manage.py sync_actions`), que agrega as actions declaradas por
> todas as views registadas *antes* de decidir o que já não existe em lado nenhum do código.
> Chamar `sync_view()` diretamente numa única view só faz upsert — nunca apaga, já que uma
> view não tem forma de saber se uma view irmã do mesmo model ainda declara uma action que
> ela própria não vê. Ver `src/django_resaas/tests/test_permissions.py` e
> `test_action_sync.py` para o comportamento exato e testado.
