# Notificações (Email / SMS / WhatsApp)

Um motor de notificações multi-tenant e assíncrono incorporado no framework
(`django_resaas.notifications`) — não é uma funcionalidade de uma app de
negócio específica. O código de negócio emite um evento; o motor resolve
regras, condições, destinatários, preferências e um template; uma linha
`NotificationOutbox` durável é criada na mesma transação de base de dados
da alteração de negócio que a despoletou; um worker Celery entrega-a mais
tarde, fora do caminho do request.

```text
Evento de negócio
  -> EventDispatcher.emit()
  -> NotificationEngine (regras -> condições -> destinatário -> preferências -> template)
  -> NotificationOutbox.objects.get_or_create(...)   # dentro da transação do chamador
COMMIT
  -> dispatch rápido (transaction.on_commit)     -> Fila -> Worker -> Provider -> DeliveryAttempt
  -> recuperação periódica (Celery Beat, sempre) -> Fila -> Worker -> Provider -> DeliveryAttempt
```

**A linha da Outbox na base de dados é a fonte de verdade, não a fila.** Se
o Celery/Redis estiver offline quando o `on_commit` tenta enfileirar, a
linha volta para `pending` e a recuperação periódica trata dela mais
tarde — a transação de negócio que a criou nunca é afetada de nenhuma das
formas.

## Opt-in por defeito — nada é enviado até todas as camadas dizerem sim

- `NOTIFICATIONS_ENABLED` (settings, default `False`) — interruptor geral do sistema.
- Uma linha `NotificationSettings` para a entity/branch, com a flag específica do canal
  (`email_enabled`/`sms_enabled`/`whatsapp_enabled`) a `True`. Sem nenhuma linha, o canal
  está desligado.
- O `module` da regra tem de ser um `EntityApp` **ativo** para essa entity — o mesmo
  mecanismo de ativação de módulo já usado por qualquer outro recurso do framework (ver
  [Registo de views](../architecture/registry.md)).
- A própria `NotificationRule` tem de ter `enabled=True` (default `False`).
- `category="marketing"` exige adicionalmente uma linha explícita
  `NotificationPreference(enabled=True)` para esse destinatário/canal exato — a ausência
  significa "não enviar", nunca um sim implícito. Todas as outras categorias são permitidas
  por defeito na ausência de preferência, mas uma linha explícita `enabled=False` (opt-out)
  é sempre respeitada, seja qual for a categoria.

Um provider configurado (variáveis de ambiente presentes) **não** implica que um canal esteja
ativo — é uma flag `NotificationSettings` explícita e separada.

## Emitir um evento de negócio

O core do `django_resaas` nunca importa modelos de negócio — o `EventDispatcher` só vê um nome
de evento, um tenant, um actor, uma referência de objecto serializável e um dict de contexto:

```python
from django_resaas.core.events import EventDispatcher

with transaction.atomic():
    sale = SaleService.confirm(...)

    EventDispatcher.emit(
        "sales.sale.confirmed",
        instance=sale,          # entity_id/branch_id/referência do objecto derivados daqui, depois descartados
        actor=request.user,
        context={"total": str(sale.total), "sale_number": sale.number},
    )
# COMMIT — a NotificationOutbox (se alguma regra corresponder) foi criada acima, dentro
# desta transação, e sofre rollback com ela se algo depois do emit() levantar excepção.
```

O `emit()` corre **síncronamente, no mesmo processo** — não é uma fila. Qualquer listener
registado (o `NotificationEngine` é um deles; trilhas de auditoria/webhooks/analytics podem
registar os seus próprios sem tocar nesta app — ver `EventDispatcher.register(pattern,
listener)`) que levante excepção é apenas logado e não propaga, para que um bug num listener
nunca quebre a transação de negócio que emitiu o evento.

## Regras, condições, destinatários, preferências, templates

Uma `NotificationRule` liga um `(entity, event, channel)` a uma estratégia de destinatário e,
opcionalmente, a uma árvore `conditions`:

```json
{
  "all": [
    {"field": "total", "operator": ">=", "value": 10000},
    {"field": "object.status", "operator": "==", "value": "confirmed"}
  ]
}
```

Operadores: `==`, `!=`, `>=`, `>`, `<=`, `<`, `in`, `not_in`, `is_null`, `is_not_null`. Sem
`eval`/`exec` — ver `notifications/conditions.py`. Qualquer segmento de field-path que comece
por `_` (`__class__`, `__dict__`, `__mro__`, `__globals__`, ...) é rejeitado explicitamente; um
operador desconhecido ou campo em falta avalia para `False`, nunca levanta excepção.

`recipient_strategy` procura no `RecipientResolverRegistry`. Incluídos: `actor`,
`object_owner`/`field_path` (lê `recipient_config["field_path"]` sobre o objecto de negócio
resolvido, ex. `"customer"`), `explicit` (`recipient_config["email"]`/`["phone"]`),
`entity_admin` (`Entity.admins`, a mesma relação que o próprio `ResaasContextService` usa),
`branch_admin` (best-effort — ver Limitações). Apps externas registam os seus próprios sem
tocar nesta app:

```python
from django_resaas.notifications.recipients import Recipient, RecipientResolverRegistry

def resolve_customer(ctx):
    customer = ctx.obj.customer
    return [Recipient(type="customer", key=f"customer:{customer.id}", email=customer.email)]

RecipientResolverRegistry.register("sales.customer", resolve_customer)
```

`NotificationTemplate` (um por `(rule, language)`, `language=null` é o default da regra)
renderiza com o Django Template Engine e é **guardado como snapshot na Outbox no momento da
criação** — editar um template mais tarde nunca altera uma linha de Outbox já criada a partir
dele, e o worker nunca volta a renderizar.

## A Outbox, o dispatcher, o worker, a recuperação

Estados da `NotificationOutbox`: `pending -> dispatching -> queued -> processing -> sent`, com
`processing -> retry -> dispatching` numa falha transitória, e uma porta manual
`failed -> pending` para a acção `retry`. Transições centralizadas em
`NotificationOutbox.transition()`/`assert_transition()` — `sent -> processing` (ou qualquer
outra transição não declarada) levanta sempre excepção.

**Reclamar** (claim) uma linha é um único `UPDATE ... WHERE status IN (...)` condicional
atómico — correcto tanto em SQLite como em Postgres sem precisar de `SELECT ... FOR UPDATE`;
um claim concorrente perdedor simplesmente afecta 0 linhas. A *seleção* em lote para a
recuperação periódica usa `select_for_update(skip_locked=True)` em Postgres (detectado por
feature) apenas como otimização de eficiência; em SQLite cai para uma leitura simples, já que
a garantia real de concorrência vem do UPDATE atómico por linha em qualquer dos casos.

- `OutboxDispatcher.try_dispatch(id)` — o caminho rápido, chamado a partir de
  `transaction.on_commit()`. Reclama a linha, tenta `process_notification.delay(id)`; se o
  broker estiver inacessível, devolve a linha a `pending` em vez de a deixar presa.
- `dispatch_pending_notifications` (Celery Beat) — encontra linhas `pending`/`retry` cujo
  `scheduled_at`/`next_retry_at` já venceu, em lotes de `NOTIFICATION_OUTBOX_BATCH_SIZE`. Esta
  é a garantia real: corre quer o caminho rápido tenha disparado quer não.
- `recover_stuck_notifications` (Celery Beat) — devolve linhas presas em
  `dispatching`/`processing` para além de `OUTBOX_DISPATCH_TIMEOUT`/`OUTBOX_PROCESSING_TIMEOUT`
  de volta a `pending`/`retry`.
- `process_notification(outbox_id)` (worker) — nunca reconstrói o objecto de negócio; carrega
  a Outbox, reclama-a, resolve o provider via `NotificationProviderRegistry`, chama
  `provider.send(...)`, regista um `NotificationDeliveryAttempt`, e actualiza a Outbox. Sai
  imediatamente (no-op) se a linha já estiver `sent`/`cancelled` — seguro sob reentrega
  at-least-once.

Os retries usam backoff exponencial com jitter (`OUTBOX_RETRY_BASE_SECONDS * 2**attempts`,
limitado a `OUTBOX_RETRY_MAX_SECONDS`) até `OUTBOX_MAX_ATTEMPTS`. Email/telefone E.164
inválido, provider em falta, ou `ProviderPermanentError`/`ProviderConfigurationError` falham
imediatamente sem retry; timeouts/erros de ligação/429/5xx são tratados como transitórios.

## Idempotência

`NotificationOutbox.idempotency_key` (único) é
`{entity_id}:{rule_id}:{channel}:{recipient_key}:{occurrence_id}` — a mesma ocorrência lógica
(mesma regra, mesmo destinatário, mesma ocorrência) resolve sempre para a mesma linha via
`get_or_create()`, quer o `emit()` seja chamado duas vezes por acidente quer uma fila
reentregue uma task. `occurrence_id` tem por defeito `{event}:{object_pk}` se o chamador não
passar um explicitamente; passa o teu próprio para qualquer coisa que precise de uma noção
mais fina de "esta ocorrência exacta". Isto é **processamento durável at-least-once com
entrega best-effort exactly-once** — não uma garantia universal de exactly-once, já que nem
todos os providers suportam uma idempotency key na sua própria API.

## Providers

`BaseNotificationProvider.send(recipient, subject, body, metadata, idempotency_key)` devolve
`{"success", "provider_message_id", "provider_status", "raw"}` ou levanta
`ProviderConfigurationError`/`ProviderPermanentError`/`ProviderTemporaryError`. Registados por
canal+nome em `NotificationProviderRegistry` — o engine/worker nunca importam um provider
concreto directamente, o que é também como os testes substituem por `Fake*Provider`s.

- **Email** — `django.core.mail.EmailMultiAlternatives`, o que já estiver configurado em
  `EMAIL_BACKEND`. Sem dependência nova; mudar para SES/SendGrid/Mailgun só implica mudar
  `EMAIL_BACKEND`.
- **SMS** — Twilio, implementado com a stdlib (`urllib`) em vez do SDK `twilio`, sem
  dependência nova obrigatória. `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`.
- **WhatsApp** — Meta WhatsApp Cloud API, também `urllib` da stdlib.
  `WHATSAPP_CLOUD_API_TOKEN`/`WHATSAPP_CLOUD_API_PHONE_NUMBER_ID`/`WHATSAPP_CLOUD_API_VERSION`.
  `provider_template_name`/`provider_language` em `NotificationTemplate.provider_metadata`
  envia um template pré-aprovado em vez de texto livre.

Nenhuma destas credenciais é alguma vez guardada na base de dados, devolvida pela API, escrita
em logs, ou exposta no contrato de Schema — apenas variáveis de ambiente.

## Referência de settings

| Setting | Default | Propósito |
|---|---|---|
| `NOTIFICATIONS_ENABLED` | `False` | Interruptor geral do sistema |
| `NOTIFICATION_OUTBOX_BATCH_SIZE` | `100` | Linhas por lote de recuperação |
| `OUTBOX_RETRY_BASE_SECONDS` / `OUTBOX_RETRY_MAX_SECONDS` | `30` / `3600` | Limites do backoff |
| `OUTBOX_MAX_ATTEMPTS` | `5` | Tentativas antes de `failed` |
| `OUTBOX_DISPATCH_TIMEOUT` / `OUTBOX_PROCESSING_TIMEOUT` | `300`s cada | Limiares de linha presa |
| `OUTBOX_RECOVERY_INTERVAL_SECONDS` | `30` | Intervalo sugerido do Beat |
| `NOTIFICATION_OUTBOX_RETENTION_DAYS` / `NOTIFICATION_ATTEMPT_RETENTION_DAYS` | `90` / `90` | Janela do `notification_cleanup` |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | não definido | Só usados por esta app |

## Configurar Celery + Beat num projecto hospedeiro

`django_resaas.notifications.tasks` usa `@shared_task`, por isso liga-se a qualquer app
Celery que o projecto hospedeiro criar — este framework não traz uma própria.
`pip install django_resaas[notifications]` para a dependência `celery`, depois, no projecto
hospedeiro (ao lado do seu `settings.py`):

```python
# yourproject/celery.py
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yourproject.settings")
app = Celery("yourproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "notifications-dispatch-pending": {
        "task": "django_resaas.notifications.dispatch_pending_notifications",
        "schedule": 30.0,  # OUTBOX_RECOVERY_INTERVAL_SECONDS
    },
    "notifications-recover-stuck": {
        "task": "django_resaas.notifications.recover_stuck_notifications",
        "schedule": 60.0,
    },
    "notifications-cleanup": {
        "task": "django_resaas.notifications.cleanup_notifications",
        "schedule": 86400.0,  # diário
    },
}
```

```python
# yourproject/__init__.py
from .celery import app as celery_app
__all__ = ("celery_app",)
```

Adiciona `"django_resaas.notifications"` a `INSTALLED_APPS` (tal como `"hr"`), depois corre as
migrations, um worker e o Beat:

```bash
python manage.py migrate
celery -A yourproject worker -l info
celery -A yourproject beat -l info
```

## Permissões, admin, REST API

Convenção standard (`{prefix}_{model_name}`, ver [Permissões](../security/permissions.md)):
`view/add/change/delete_notificationrule`, o mesmo para `template`/`preference`/`settings`.
`NotificationOutbox`/`NotificationDeliveryAttempt` só expõem `view_*` — `create`/`update`/
`partial_update`/`destroy` devolvem `405` em ambos os ViewSets, para que um `PATCH` genérico
nunca possa marcar uma linha como `sent` à mão. As únicas mutações são duas acções
permission-checked: `POST .../outbox/<id>/retry/` (codename `retry_notificationoutbox`, só
válido a partir de `failed`) e `POST .../outbox/<id>/cancel/` (codename
`cancel_notificationoutbox`, só válido antes de `sent`). O Django Admin regista os seis
modelos; Outbox/DeliveryAttempt também são read-only ali.

As permissões `retry`/`cancel` são geridas por `@resaas_action`, o que significa que as suas
linhas `Permission` só são criadas depois de `ActionSyncService.sync_registry()` correr *depois*
de `django_resaas.notifications.views` ter sido importado (populando o `VIEW_REGISTRY`) — corre
`python manage.py sync_actions` uma vez, depois da app ter arrancado pelo menos uma vez (ex.:
depois do primeiro `runserver`/primeiro request, para o URLconf já ter carregado), para as criar;
depois concede-as ao grupo que precisar delas como qualquer outra permission — nenhum dos dois
passos é automático, tal como qualquer outro `@resaas_action` neste framework (ver
[Registo de views](../architecture/registry.md)).

`GET /api/notifications/catalog/` (`APIView` simples, aditivo, fora do `ResaasSchemaBuilder`)
lista os canais/categorias/prioridades suportados e os eventos já configurados nesta entity —
para uma futura tela Quasar de "Definições de Notificações". Cada modelo continua a ganhar o
seu contrato Schema 1.0 normal de graça via `class RESAAS: crud = True` — nada mudou no
schema builder partilhado.

## Diagnosticar e operar

```bash
python manage.py resaas_notifications_check   # nunca imprime secrets
python manage.py notification_dispatch_pending
python manage.py notification_recover_stuck
python manage.py notification_cleanup
```

## Limitações conhecidas

- **`branch_admin` é best-effort.** O framework não tem hoje um papel explícito de "admin de
  branch" (`BranchUser` não tem flag de admin) — o resolver incluído procura utilizadores com
  uma permission configurável (`recipient_config["permission"]`, default `"change_branch"`)
  via `BranchUserGroup`. Regista o teu próprio resolver para algo mais preciso.
- **O fallback de idioma é recipient -> `NotificationSettings.default_language` ->
  `LANGUAGE_CODE` do Django** — dois níveis garantidos, não três. A `Entity` não tem campo de
  idioma próprio neste framework; o default a nível de entity vive na linha
  `NotificationSettings` que esta app introduz, em vez de um novo campo em `Entity`.
- **O fallback de canal não volta a renderizar nada.** `NotificationRule.fallback_channel`
  (desligado por defeito) reutiliza o corpo/assunto já renderizado do canal original em vez de
  voltar a escolher um template para o canal de fallback — aceitável para fallback SMS/WhatsApp
  a partir de um envio WhatsApp falhado, menos se o canal de fallback precisar mesmo de
  conteúdo diferente.
- **`unique_together(rule, language)` da `NotificationTemplate`** não impede duas linhas com
  `language=null` para a mesma regra ao nível da base de dados (NULLs SQL não são iguais numa
  unique constraint) — impõe "um template default por regra" ao nível da aplicação se isso for
  importante. A mesma ressalva aplica-se à constraint `(entity, branch)` da
  `NotificationSettings` para duas linhas entity-wide (`branch=null`).
- **`NotificationRule.deduplication_key`**, descrito em notas de desenho anteriores, ficou fora
  de escopo — `idempotency_key` já dá a garantia central de prevenção de duplicados; uma janela
  de dedup do tipo "ainda verdadeiro enquanto a condição persistir" (ex.: "não voltar a
  notificar stock baixo a cada save enquanto continuar baixo") é uma adição futura razoável,
  não implementada aqui.
