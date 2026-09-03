# Criar um Novo Recurso Backend

A checklist completa para acrescentar um recurso (model → API → schema) a uma app já instalada ao
lado do `django_resaas`. Para o primeiríssimo recurso num projeto novo, fazer primeiro a
[Instalação](../getting-started/installation.md) — esta página assume que o `urls.py` já está
ligado e que existe pelo menos um `EntityType`.

## 1. Model

Herdar `BaseModel` para tudo o que seja delimitado por tenant (ganha `entity`/`branch`, soft
delete, `created_by`/`updated_by` de graça — ver [Multi-tenancy](../architecture/multi-tenancy.md)),
ou `TimeModel`/`SoftBaseModel` para algo global sem tenant (o próprio `User`, `Entity`, etc. do
framework são construídos assim).

```python
# sua_app/models/patient.py
from django.db import models
from django_resaas.core.base.models import BaseModel

class Patient(BaseModel):
    nid = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=150)

    class RESAAS:
        label_field = "name"
        search_fields = ["nid", "name"]
        crud = True
```

```bash
python manage.py makemigrations sua_app
python manage.py migrate
```

Ver [Models & RESAAS](../models/resaas-config.md) para todos os atributos de `class RESAAS`.

## 2. Serializer

Herdar `BaseSerializer` em vez do `ModelSerializer` do DRF diretamente — já marca
`id`/`entity`/`branch`/`created_by`/`updated_by`/`created_at`/`updated_at`/`deleted_at` como só de
leitura, e traz o tratamento de campos dinâmicos, de ficheiro (ver
[Ficheiros e PDF](../features/files-pdf.md)) e de representação label/value usados em todo o
framework:

```python
# sua_app/serializers/patient.py
from django_resaas.core.base.serializers import BaseSerializer
from sua_app.models.patient import Patient

class PatientSerializer(BaseSerializer):
    class Meta:
        model = Patient
        fields = "__all__"
```

Detalhe completo dos mixins em
[Referência pública da API](../api/public-api-reference.md#baseserializer---django_resaascorebaseserializersbaseserializer).

## 3. View

Herdar `BaseAPIView`, não um `ModelViewSet` do DRF puro, a menos que o recurso genuinamente não
precise de nenhuma delimitação por tenant, permissões ou ativação de módulo:

```python
# sua_app/views/patient.py
from django_resaas.core.base.views import BaseAPIView, register_view
from sua_app.models.patient import Patient
from sua_app.serializers.patient import PatientSerializer

@register_view("patients", module="sua_app")
class PatientAPIView(BaseAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
```

`register_view` é o mesmo decorator com um nome consistente com PEP 8 (`registerView =
register_view`) — usar o que preferir, ambos continuam suportados; todos os pontos de chamada já
existentes em `hr/views/*.py` usam `registerView`. `name` (o segmento de prefixo de URL) tem por
omissão o nome da classe em minúsculas, com `APIView` removido e um `s` acrescentado, se omitido;
`module` tem por omissão o pacote de topo da classe. Ver [Registo de views](../architecture/registry.md)
para exatamente o que o decorator faz.

Isto já é CRUD completo, paginação, ordenação, `?search=`, soft delete/restore/hard delete, e um
endpoint de schema — nada mais a escrever para o comportamento base.

### Actions personalizadas (`@resaas_action`)

```python
@registerView("sales")
class SaleAPIView(BaseAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    @resaas_action(
        methods=["post"],
        detail=True,
        label="Confirm",
        permission="confirm_sale",  # opcional - ver abaixo
    )
    def confirm(self, request, pk=None):
        ...
```

O decorator só anexa metadados ao método; o `ActionSyncService` (corrido a partir de
`post_migrate` e `manage.py sync_actions`) é quem de facto cria/atualiza a linha
`ModelExtraAction` e a `Permission` do Django.

- **Ownership da permissão**: se `permission=` for omitido, o codename tem por omissão
  `f"{action_name}_{model_name}"`. Passar `permission=` explicitamente permite que uma action
  reutilize uma permissão já existente no mesmo model (ex.: duas actions a partilhar um único
  portão "pode gerir") — a procura é sempre delimitada ao `ContentType` do próprio model, pelo que
  uma permissão com o mesmo nome noutro model não é reutilizada por engano, e o `.name` de uma
  permissão partilhada/explícita nunca é reescrito automaticamente (ao contrário do caso de
  convenção por omissão, onde É mantido em sincronia com o label/model da action, enquanto a
  permissão for gerida pelo RESAAS).
- **Manual vs. decorator**: uma linha `ModelExtraAction` com `managed_by="manual"` (o padrão para
  qualquer coisa criada fora do `ActionSyncService`, ex. à mão via admin) nunca pode ser tomada
  silenciosamente por um decorator com a mesma identidade `app.model.action` — sincronizar levanta
  `ImproperlyConfigured` em vez disso. Para entregar uma action ao decorator de propósito, definir
  `managed_by="decorator"` na linha existente primeiro.
- **Várias views, um model**: duas views diferentes podem cada uma declarar actions para o mesmo
  model sem se pisarem — a remoção de órfãos só acontece em `sync_registry()` (o ponto de entrada
  do `post_migrate`/`sync_actions`), que agrega as actions de todas as views registadas antes de
  decidir o que já não existe. Chamar `sync_view()` diretamente numa única view só faz upsert;
  nunca apaga.

Referência completa de argumentos e regras de ownership de permissões em
[Permissões](../security/permissions.md#permissões-de-actions-personalizadas-e-ownership).

## 4. Rotas

Nada a registar manualmente. `build_saas_urls()` (`urls.py`) percorre o `VIEW_REGISTRY` e regista
automaticamente cada classe `@register_view`'d num `DefaultRouter` — o único requisito é que o
módulo que define a view seja de facto *importado* antes de `build_saas_urls()` correr
(tipicamente via o próprio `views/__init__.py` da app, importado como efeito secundário do
`include()` do `urls.py` da app). Ver
[Registo de views#quando-é-que-view_registry-é-realmente-preenchido](../architecture/registry.md#quando-é-que-view_registry-é-realmente-preenchido)
para o requisito de ordem que isto implica em `urls.py`.

## 5. Ativar o módulo numa entidade

Uma view registada não fica acessível a um tenant até a sua app ser explicitamente ativada — isto
é independente da instalação Django:

```python
from django_resaas.models.app import App
from django_resaas.models.entity_app import EntityApp

app, _ = App.objects.get_or_create(name="sua_app", defaults={"state": "Active"})
EntityApp.objects.get_or_create(entity=minha_entidade, app=app, defaults={"state": "Active"})
```

> [!WARNING]
> Sem isto, todo o pedido aos endpoints de `sua_app` dá 403 para esse tenant antes de o
> queryset sequer ser tocado — ver
> [BaseAPIView#module-activation](../api/base-api-view.md#module-activation).

## 6. Permissões

Nada a escrever à mão para os codenames de CRUD padrão — são gerados automaticamente assim que a
app deste recurso migra:

- O próprio sinal `post_migrate` do Django cria `add_<model>`/`change_<model>`/`delete_<model>`/
  `view_<model>` para cada model (comportamento padrão do Django).
- O sinal próprio do `django_resaas` acrescenta `list_<model>`/`pdf_<model>`/`pdf_list_<model>`/
  `restore_<model>`/`hard_delete_<model>` — mas só depois de existir pelo menos um `EntityType`,
  razão pela qual a [Instalação](../getting-started/installation.md) corre `migrate` uma segunda
  vez depois do `create_entity`.
- Qualquer `@resaas_action` ganha o seu próprio `<action>_<model>` permission (ou um partilhado
  explícito) — ver o passo 3 acima.

Confirmar que os codenames esperados existem (`Permission.objects.filter(content_type__model=...)`),
e atribuí-los ao grupo relevante — ver [Permissões](../security/permissions.md) para como
`isPermited()`/`check_permission()` resolvem o grupo de um utilizador para um codename.

## 7. Testes

No mínimo, cobrir: isolamento por entidade, isolamento por sucursal, pesquisa, filtros, criação,
atualização, soft delete/restore, e permissões (tanto o caso "tem" como o caso "não tem"). O
próprio conjunto de testes do framework é o padrão de referência a seguir — ver
`src/django_resaas/tests/test_tenant.py`, `test_soft_delete.py`, `test_module_activation.py`,
`test_permissions.py` e `test_action_sync.py`, ou o exemplo completo em
`src/dev/demo/tests/test_flow.py` (o mesmo fluxo do [Início rápido](../getting-started/quick-start.md),
como teste executável).
