# Comandos de Gestão

## `create_root`

```bash
python manage.py create_root
```

O bootstrap empresarial completo. Pede interativamente um username/email (rejeitando um email já
em uso) e uma password (input escondido, com confirmação), depois cria um superuser e toda a
estrutura de tenant por omissão numa só passagem: um `EntityType` ("SaaS"), uma `Entity`
("Tenant"), uma `Branch` ("Main"), os `GROUPS` por omissão (Guest, Admin, Root) ligados ao
entity type/entity/branch/user, as apps `django_resaas` e `hr` registadas e ligadas ao entity
type/entity, mais valores por omissão de frontend e idioma (via `FrontEndService.load_defaults` e
`LanguageService.load_defaults`). Pensado para correr uma vez por ambiente, para obter um sistema
totalmente funcional a partir de uma base de dados em branco.

## `create_entity`

```bash
python manage.py create_entity
```

Um bootstrap interativo mais leve: pede um nome de entity type, nome de entity e nome de branch,
obtém ou cria um superuser via `UserService.get_or_create_superuser`, depois delega a ligação
real de entity/branch/group em `BootstrapService.run(...)`. Usar isto quando é preciso outra
entidade/sucursal sob uma configuração já existente, em vez do fluxo `create_root` de raiz.

## `sync_actions`

```bash
python manage.py sync_actions
```

Sincroniza métodos decorados com `@resaas_action` com linhas `ModelExtraAction` e objetos
`Permission` do Django. Lê cada view registada em `VIEW_REGISTRY` (ver
[Referência pública da API](../api/public-api-reference.md) para como as views são registadas via
`registerView`), imprime cada módulo e view encontrados, depois chama
`ActionSyncService.sync_registry(VIEW_REGISTRY)` dentro de uma transação. Correr isto depois de
acrescentar ou alterar métodos `@resaas_action`, para que os seus metadados (label, ícone,
permissão, endpoint) fiquem visíveis através do output `actions`/`permissions.custom` do
`ResaasSchemaBuilder`. Avisa e sai mais cedo se `VIEW_REGISTRY` estiver vazio (nenhuma view foi
registada/importada ainda).

## `sync_language`

```bash
python manage.py sync_language
```

Carrega os idiomas por omissão chamando `TranslationSyncService.sync(...)`.

## `setup`

```bash
python manage.py setup
```

Carrega os valores por omissão do sistema em sequência: `LanguageService.load_defaults(...)`,
`FrontEndService.load_defaults(...)`, `TranslationService.load_defaults(...)`. Um bootstrap mais
estreito do que `create_root`/`create_entity` — não cria superuser nem estrutura de tenant, só a
base de idioma/frontend/tradução.

## `check` (o próprio system check do Django)

```bash
python manage.py check
```

> [!NOTE]
> Desde a limpeza da Fase 2, isto corre a própria framework de system checks do Django
> (`django.core.checks`). Antes, um comando local ao projeto sombreava-o com o mesmo nome —
> ver `check_metano` abaixo para onde isso passou a viver.

## `check_metano`

```bash
python manage.py check_metano [--path PATH] [--strict]
```

O linter local ao projeto de "conformidade MetanoStack" (era `check.py`, renomeado na Fase 2
porque sombreava o comando `check` nativo do Django acima). Percorre recursivamente ficheiros
`.py` sob `--path` (por omissão `.`) à procura de um pequeno conjunto de padrões textuais
proibidos: `models.Model`, `ModelSerializer`, `ModelViewSet`, e `from .` (imports relativos) — a
ideia sendo que código de aplicação deve construir sobre `BaseModel`/`BaseSerializer`/`BaseAPIView`
do framework e usar imports absolutos em vez das classes base em bruto do Django ou imports
relativos. Imprime uma linha por correspondência encontrada; com `--strict`, levanta
`CommandError` (saída não-zero) se alguma correspondência for encontrada, caso contrário só
reporta e termina normalmente — útil para CI vs. uso consultivo local, respetivamente.
