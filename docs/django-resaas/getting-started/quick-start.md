# Início Rápido

Um percurso guiado pelo fluxo completo do `django_resaas`, de ponta a ponta: um model → uma API
CRUD completa, delimitada por tenant, autorizada por permissão, descrita por um schema — sem nada
escrito à mão além do model, do seu serializer e da sua view. Espelha a própria app de exemplo do
framework, `dev/demo`, cujo comportamento é validado por `dev/demo/tests/test_flow.py` — esse
teste é o que o CI realmente corre contra este fluxo.

Completar primeiro a [Instalação](installation.md).

## 1. Model

```python
# sua_app/models/product.py
from django.db import models
from django_resaas.core.base.models import BaseModel

class Product(BaseModel):          # entity/branch, soft delete, created/updated_by - tudo grátis
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class RESAAS:
        label_field = "name"
        search_fields = ["name", "sku"]
        crud = True
        icon = "mdi-package-variant"
```

```bash
python manage.py makemigrations sua_app
python manage.py migrate
```

Ver [Models & RESAAS](../models/resaas-config.md) para todos os atributos de `class RESAAS`.

## 2. Serializer

```python
# sua_app/serializers/product.py
from django_resaas.core.base.serializers import BaseSerializer
from sua_app.models.product import Product

class ProductSerializer(BaseSerializer):
    class Meta:
        model = Product
        fields = "__all__"
```

O `BaseSerializer` já marca `id`/`entity`/`branch`/`created_by`/`updated_by`/`created_at`/
`updated_at`/`deleted_at` como só de leitura — ver
[Referência pública da API](../api/public-api-reference.md).

## 3. View

```python
# sua_app/views/product.py
from django_resaas.core.base.views import BaseAPIView, register_view
from sua_app.models.product import Product
from sua_app.serializers.product import ProductSerializer

@register_view(module="sua_app")
class ProductAPIView(BaseAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
```

É praticamente tudo. Já tem CRUD completo, paginação, ordenação, `?search=`, soft delete/restore/
hard delete, e um endpoint de schema — ver [Criar um novo recurso](../development/creating-resource.md)
para o percurso completo (actions personalizadas, rotas, permissões, testes) e
[BaseAPIView](../api/base-api-view.md) para o que cada uma dessas coisas faz por dentro.

## 4. Ativar o módulo numa entidade

Uma app só fica utilizável para um tenant depois de ativada explicitamente. O `create_entity`
(da Instalação) só ativa o `hr` por omissão — qualquer outra app, incluindo esta, precisa do
mesmo tratamento:

```python
from django_resaas.models.app import App
from django_resaas.models.entity_app import EntityApp

app, _ = App.objects.get_or_create(name="sua_app", defaults={"state": "Active"})
EntityApp.objects.get_or_create(entity=minha_entidade, app=app, defaults={"state": "Active"})
```

> [!WARNING]
> Sem isto, `BaseAPIView.initial()` rejeita todos os pedidos aos endpoints de `sua_app` com
> um 403, para qualquer tenant que não o tenha feito — ver
> [BaseAPIView#module-activation](../api/base-api-view.md#module-activation).

## 5. Chamar a API

Todo o pedido autenticado precisa de três cabeçalhos: um JWT, um contexto de tenant assinado, e um
id de idioma. Obter os dois primeiros uma única vez:

```bash
# 1. login
curl -X POST http://localhost:7002/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier": "voce@exemplo.com", "password": "..."}'
# -> {"access": "...", "refresh": "...", ...}

# 2. emitir um contexto de tenant assinado (entity/branch/group criados no create_entity)
curl -X POST http://localhost:7002/api/resaas/context/ \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"entity_id": "<entity-uuid>", "branch_id": "<branch-uuid>", "group_id": "<root-group-uuid>"}'
# -> {"token": "<context-token>", "context": {...}}
```

Depois, em cada pedido:

```bash
# schema - o que um frontend precisa para renderizar este recurso
curl -H "Authorization: Bearer $JWT" -H "X-RESAAS-Context: $CTX" -H "L: 1" \
     http://localhost:7002/api/django_resaas/resaasapps/sua_app/product/schema/

# listar
curl -H "Authorization: Bearer $JWT" -H "X-RESAAS-Context: $CTX" -H "L: 1" \
     http://localhost:7002/api/sua_app/products/

# criar
curl -X POST -H "Authorization: Bearer $JWT" -H "X-RESAAS-Context: $CTX" -H "L: 1" \
     -H "Content-Type: application/json" \
     -d '{"name": "Widget", "sku": "WID-1", "price": "9.99"}' \
     http://localhost:7002/api/sua_app/products/
```

Ver [Multi-tenancy](../architecture/multi-tenancy.md) para o que o token de contexto transporta e
como é validado em cada pedido.

## O que isto prova

- **Multi-tenancy** — `Product` herda `entity`/`branch` de `BaseModel` e é automaticamente
  delimitado ao tenant do contexto assinado do pedido; ver [Multi-tenancy](../architecture/multi-tenancy.md).
- **Autorização** — o pedido é rejeitado a menos que o grupo do utilizador tenha a permissão
  `list_product`/`add_product`/... gerada automaticamente, para a sucursal ativa; ver
  [Permissões](../security/permissions.md).
- **Soft delete** — `DELETE` não remove a linha; `?objects=all` e `POST .../restore/` trazem-na de
  volta; ver [Soft delete](../features/soft-delete.md).
- **Pesquisa dinâmica** — `?search=widget` corresponde a `RESAAS.search_fields`; ver
  [Pesquisa](../api/search.md).
- **O contrato Schema 1.0** — a resposta do endpoint de schema corresponde exatamente a
  [O contrato Schema 1.0](../api/schema-contract.md): `ui.icon`, `filters.search_fields` e
  `model.endpoint` vêm diretamente da configuração `RESAAS` de `Product`.
