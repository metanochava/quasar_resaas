# Instalação

O `django_resaas` é uma app Django reutilizável: encaixa-se num projeto Django normal em vez de
correr como um. Esta página mostra a ligação desde um projeto em branco até um servidor a
responder a pedidos reais da API. Para a versão totalmente funcional de tudo o que se segue —
model real, chamadas `curl` reais — ver `src/dev/README.md`, a app de exemplo do próprio projeto.

## 1. Instalar

```bash
pip install django_resaas
```

## 2. `settings.py`

```python
AUTH_USER_MODEL = 'django_resaas.User'

MY_APPS = [
    'django_resaas',
    'hr',                   # módulo próprio do framework - ver hr/overview.md
    'sua_app',               # a(s) sua(s) app(s)
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
    # ... valores por omissão do Django ...
    'django_resaas.core.middleware.file_access.FileAccessMiddleware',
    'django_resaas.core.middleware.tenant.TenantContextMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PERMISSION_CLASSES': (),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}
```

O `hr` não é opcional na prática: `django_resaas/urls.py` faz `include('hr.urls')`
incondicionalmente, pelo que qualquer projeto que instale `django_resaas` precisa também de `hr`
instalado — ver [`hr/overview.md`](../hr/overview.md).

`TenantContextMiddleware` e `FileAccessMiddleware` são os dois middlewares ativos por omissão —
ver [`architecture/middleware.md`](../architecture/middleware.md) para o que cada um faz e para o
terceiro (`FrontEndMiddleware`) que existe mas não vem ligado por omissão.

## 3. `urls.py`

```python
from django.urls import path, include
from django_resaas.core.utils.autoload_urls import build_saas_urls

urlpatterns = [
    path('api/', include('django_resaas.urls')),
    path('api/sua_app/', include('sua_app.urls')),
]

# TEM de correr depois dos include() acima - ver architecture/registry.md
router, extra_patterns = build_saas_urls()
urlpatterns += [path('api/', include(router.urls))]
urlpatterns += extra_patterns
```

`build_saas_urls()` percorre o `VIEW_REGISTRY`, que só fica preenchido depois de cada classe
`@register_view` ser efetivamente importada — o que acontece como efeito secundário dos
`include()` acima correrem primeiro. A ordem importa aqui; ver
[`architecture/registry.md`](../architecture/registry.md#quando-e-que-view_registry-e-realmente-preenchido)
para o porquê.

## 4. Migrar e inicializar

```bash
python manage.py migrate
python manage.py create_entity   # interativo: superuser + tenant + grupo Admin
python manage.py migrate         # outra vez - ver abaixo
```

O segundo `migrate` não é um erro. As permissões de CRUD (`list_<model>`, `add_<model>`, ...) são
criadas por um sinal `post_migrate` que não faz nada até existir pelo menos um `EntityType` — o
`create_entity` é o que cria o primeiro. Correr `migrate` outra vez (idempotente — não aplica
migrações novas) dispara o sinal de novo, agora que a condição está satisfeita. Sem este passo,
todos os pedidos falham a autorização, sem permissões disponíveis para atribuir a nenhum grupo.

`create_root` é a alternativa para um ambiente novo de raiz (superuser + estrutura de tenant
completa numa só vez); `create_entity` serve para acrescentar outra entidade/sucursal a uma
instalação já existente. Ambos em
[`development/management-commands.md`](../development/management-commands.md).

## 5. Correr

```bash
python manage.py runserver 0.0.0.0:7002
```

A partir daqui, seguir para [Início rápido](quick-start.md) para registar o primeiro model de
ponta a ponta, ou ir direto a
[Criar um novo recurso](../development/creating-resource.md) para o guia de referência.

## Metade frontend

Esta página cobre apenas o backend. O pacote frontend, `quasar_resaas` (Vue 3 + Quasar), tem a sua
própria documentação de instalação — mude para o produto `quasar_resaas` no topo da barra lateral
se estiver a ler isto a partir do visualizador de documentação.
