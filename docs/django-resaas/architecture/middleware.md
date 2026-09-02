# Middleware

O `django_resaas` distribui três classes de middleware em `django_resaas.core.middleware`. Só
duas estão ativas por omissão na configuração `MIDDLEWARE` do projeto `src/dev`.

## `TenantContextMiddleware` (`core/middleware/tenant.py`) — ativo por omissão

Corre em cada pedido. Inicializa `request.tenant_context`, `request.tenant_context_error`,
`request.entity_type_id`, `request.entity_id`, `request.branch_id`, `request.group_id` a `None`, e
`request.lang_id` a partir do cabeçalho `L`. Se o cabeçalho `X-RESAAS-Context` estiver presente,
descodifica-o via `ResaasContextService.decode(token)` e preenche `entity_type_id`/`entity_id`/
`branch_id`/`group_id` a partir do payload descodificado; uma falha na descodificação é capturada
em `request.tenant_context_error` em vez de ser levantada, para que o código a jusante
(verificações de permissão, filtragem de queryset — ver
[Multi-tenancy](multi-tenancy.md)) veja sempre um contexto de tenant consistente (ainda que
vazio).

## `FileAccessMiddleware` (`core/middleware/file_access.py`) — ativo por omissão

Só atua em pedidos cujo caminho começa por `settings.MEDIA_URL`. Exige um parâmetro de query
`?token=` validado por `FullPath.validate_token(token)`; sem um token válido devolve uma resposta
JSON `401` (`{"alert_error": "..."}`). É isto que protege o acesso direto a ficheiros de media
enviados (ver [Ficheiros e PDF](../features/files-pdf.md)).

## `FrontEndMiddleware` (`core/middleware/front_end.py`) — **não ativo por omissão**

Disponível mas comentado em `src/dev/settings.py`. Quando ativado, restringe qual "frontend"
registado (model `FrontEnd`, identificado por credenciais nos cabeçalhos `FEK`/`FEP`) pode chamar
qual âmbito de URL (`/api/<scope>/...`) e com que métodos HTTP, com base nas definições
`DJANGO_REST_AUTH.FRONT_END` (`REQUIRE_CREDENTIALS`, `PUBLIC_URL`, `URL_RULES`):

- Se `REQUIRE_CREDENTIALS` for falso, o middleware só aplica as regras de âmbito público/scope
  abaixo e nunca exige `FEK`/`FEP`.
- Caso contrário, todo o pedido precisa de cabeçalhos `FEK`/`FEP` válidos correspondentes a uma
  linha `FrontEnd`, a menos que o seu âmbito de URL esteja listado em `FRONT_END.PUBLIC_URL`.
- `frontend.access` (`super`, `read`, `readwrite`, `write`) delimita tanto o âmbito de URL (contra
  `FRONT_END.URL_RULES`) como o método HTTP permitido para esse nível de acesso.

**Problema conhecido:** a linha comentada em `src/dev/settings.py` referencia
`django_resaas.core.middleware.frontend.FrontEndMiddleware` (sem underscore), mas o módulo real é
`django_resaas.core.middleware.front_end` (com underscore). Descomentar essa linha tal como está
levantaria `ModuleNotFoundError` — o caminho precisa do underscore acrescentado antes de este
middleware poder ser ativado de facto.
