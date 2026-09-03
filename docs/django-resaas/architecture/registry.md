# Registo de views

Toda a subclasse de `BaseAPIView` regista-se com `@register_view(name=None, module=None)`
(`core/base/views.py`). `registerView` é o nome original em camelCase que todos os pontos de
código já existentes usam (`hr/views/*.py` e afins) e continua a ser um simples alias —
`registerView = register_view` — nada se parte; código novo pode usar qualquer um dos dois.

```python
@register_view("patients")
class PatientAPIView(BaseAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
```

## O que o decorator faz

```python
VIEW_REGISTRY: dict[str, dict[str, type]] = {}

def register_view(name=None, module=None):
    def decorator(cls):
        key = name or cls.__name__.lower().replace('apiview', '') + 's'
        module_name = module or cls.__module__.split(".")[0]
        VIEW_REGISTRY.setdefault(module_name, {})[key] = cls
        cls.module_name = module_name  # usado por BaseAPIView.initial() - ver api/base-api-view.md
        return cls
    return decorator
```

Duas coisas independentes acontecem: a classe é adicionada a `VIEW_REGISTRY`
(`{module_name: {key: ViewClass}}`), e `cls.module_name` é definido — o mesmo atributo que
`BaseAPIView.initial()` verifica contra `EntityApp` para a ativação de módulo.

## A cadeia: View → VIEW_REGISTRY → ActionSyncService → Schema

```text
@register_view + @resaas_action
        |
        v
   VIEW_REGISTRY               (preenchido em tempo de importação - ver a nota
        |                       "quando é que isto é realmente preenchido" abaixo)
        v
ActionSyncService.sync_registry(VIEW_REGISTRY)
        |                       (sinal post_migrate / manage.py sync_actions)
        v
  ModelExtraAction + Permission   (ver ../security/permissions.md para as
        |                          regras de ownership manual/decorator)
        v
ResaasSchemaBuilder.build()      (por model, em tempo de pedido - ver
        |                          schema-contract.md)
        v
  Schema 1.0 "actions"
        |
        v
   quasar_resaas (frontend)
```

## Quando é que VIEW_REGISTRY é realmente preenchido

`@register_view` só corre quando o seu módulo é *importado*. O `dev/urls.py` importa todas as
views (diretamente ou via `views/__init__.py` de cada app, ex.: `hr/views/__init__.py`) como
efeito secundário de construir o router — ver o comentário no topo de `dev/urls.py` para o porquê
de `build_saas_urls()` correr especificamente *depois* dos `include(...)` acima. Um processo que
nunca toca no `ROOT_URLCONF` (um `manage.py migrate` isolado, por exemplo) pode nunca preencher
`VIEW_REGISTRY`.

> [!NOTE]
> Quando isso acontece, `sync_resaas_actions` (o recetor do `post_migrate`) não faz nada
> silenciosamente — isto é uma limitação conhecida, não algo que esta fase tenha alterado.
