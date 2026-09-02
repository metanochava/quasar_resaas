# FAQ — Como começar com o django_resaas

Respostas práticas, pela ordem em que realmente se precisa delas ao criar
um novo recurso.

## Instalação

```bash
pip install django_resaas
```

No `settings.py` do teu projecto:

```python
AUTH_USER_MODEL = 'django_resaas.User'

MY_APPS = [
    'django_resaas',
    'minha_app',
]

INSTALLED_APPS = MY_APPS + [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'django_filters',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework.authtoken',
]

MIDDLEWARE = [
    # ... middlewares por omissão do Django ...
    'django_resaas.core.middleware.file_access.FileAccessMiddleware',
    'django_resaas.core.middleware.tenant.TenantContextMiddleware',
]
```

```python
# urls.py
from django.urls import path, include
from django_resaas.core.utils.autoload_urls import build_saas_urls

urlpatterns = [
    path('api/', include('django_resaas.urls')),
    path('api/minha_app/', include('minha_app.urls')),
]

# TEM de correr depois dos include() acima - ver "Como funciona registerView?"
router, extra_patterns = build_saas_urls()
urlpatterns += [path('api/', include(router.urls))]
urlpatterns += extra_patterns
```

```bash
python manage.py migrate
python manage.py create_entity   # interactivo: superuser + tenant + grupo Admin
python manage.py migrate         # outra vez - ver "Como adiciono uma permission?"
```

## Como crio uma app?

Uma app normal do Django, adicionada a `MY_APPS`:

```bash
python manage.py startapp minha_app
```

```python
MY_APPS = ['django_resaas', 'minha_app']
```

## Como registo um model?

Herdar de `BaseModel` (tenant-aware — ganha `entity`/`branch`, soft
delete, `created_by`/`updated_by` de borla) ou de `TimeModel`/
`SoftBaseModel` para algo global, sem tenant.

```python
from django.db import models
from django_resaas.core.base.models import BaseModel

class Produto(BaseModel):
    nome = models.CharField(max_length=150)
    preco = models.DecimalField(max_digits=10, decimal_places=2)

    class RESAAS:
        label_field = "nome"
        search_fields = ["nome"]
        crud = True
```

**O tenant nunca é adivinhado.** `BaseModel.save()` levanta
`ValidationError` se `entity`/`branch` não forem definidos explicitamente
— ver [Multi-tenancy](../django-resaas/architecture/multi-tenancy.md).
Via API isto é automático; num shell/script/migração de dados tens de os
definir tu.

## Preciso criar serializer?

Sim, mas costuma ser poucas linhas — reutiliza `BaseSerializer`:

```python
from django_resaas.core.base.serializers import BaseSerializer
from minha_app.models.produto import Produto

class ProdutoSerializer(BaseSerializer):
    class Meta:
        model = Produto
        fields = "__all__"
```

## Preciso criar ViewSet?

Sim — herdar `BaseAPIView`:

```python
from django_resaas.core.base.views import BaseAPIView, register_view

@register_view(module="minha_app")
class ProdutoAPIView(BaseAPIView):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer
```

Com isto já tens CRUD completo, paginação, ordenação, `?search=`, soft
delete/restore/hard delete, e endpoint de schema — tudo automático.

## Como funciona registerView?

`@register_view` (alias: `registerView`, o nome original — ambos
continuam suportados) regista a view em `VIEW_REGISTRY` (o que constrói
os URLs) e define `cls.module_name`, o atributo que
`BaseAPIView.initial()` verifica contra `EntityApp` para saber se o
tenant tem o módulo activo. Ver [View registry](architecture/registry.md)
(se ainda não existir nesta árvore, ver a versão em inglês no repositório
`django_resaas`).

## Como gero schema?

Nada a fazer manualmente — assim que o model tem view registada, o
schema já está disponível em:

```
GET /api/django_resaas/resaasapps/<app>/<Model>/schema/
```

## Como adiciono uma action?

```python
from django_resaas.core.decorators.action import resaas_action
from django_resaas.core.utils import ok

@register_view(module="minha_app")
class ProdutoAPIView(BaseAPIView):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

    @resaas_action(methods=["post"], detail=True, label="Descontinuar")
    def descontinuar(self, request, pk=None):
        produto = self.get_object()
        # ... lógica ...
        return ok(request, "Descontinuado")
```

O decorator só guarda metadata (nunca escreve na base de dados) — quem
persiste é o `ActionSyncService` (`post_migrate` / `manage.py
sync_actions`).

## Como adiciono uma permission?

Normalmente não precisas — são geradas automaticamente: as 4 permissões
padrão do Django (`add_/change_/delete_/view_<model>`) mais
`list_/pdf_/restore_/hard_delete_<model>` (geradas pelo próprio
django_resaas, só depois de existir pelo menos uma `EntityType` — daí o
"migrate outra vez" na instalação). Cada `@resaas_action` gera a sua
própria permission (ou usa uma explícita via `permission=...`).

**Uma permission criada manualmente nunca é apagada automaticamente**, e
um `@resaas_action` nunca assume ownership silencioso de uma action já
existente com `managed_by="manual"` — ver
[Permissions](security/permissions.md).

## Como activo o módulo numa entidade?

```python
from django_resaas.models.app import App
from django_resaas.models.entity_app import EntityApp

app, _ = App.objects.get_or_create(name="minha_app", defaults={"state": "Active"})
EntityApp.objects.get_or_create(entity=minha_entidade, app=app, defaults={"state": "Active"})
```

Sem isto, `BaseAPIView.initial()` rejeita com 403 qualquer request aos
endpoints desse módulo.

---

Para o lado frontend desta mesma jornada (formulários, `BaseStore`,
`AutoCrud`), ver a [FAQ do quasar_resaas](../quasar-resaas/faq.md).
