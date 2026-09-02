# Registo de views

Toda a subclasse de `BaseAPIView` regista-se com
`@register_view(name=None, module=None)` (`core/base/views.py`).
`registerView` é o nome original (camelCase) que todos os sítios de
código já existentes usam, e continua a ser um alias simples —
`registerView = register_view` — nada quebra; código novo pode usar
qualquer um dos dois.

```python
@register_view("pacientes")
class PacienteAPIView(BaseAPIView):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
```

## O que o decorator faz

Duas coisas independentes: a classe é adicionada a `VIEW_REGISTRY`
(`{module_name: {key: ViewClass}}`), e `cls.module_name` é definido — o
mesmo atributo que `BaseAPIView.initial()` verifica contra `EntityApp`
para a activação de módulo.

## A cadeia: View → VIEW_REGISTRY → ActionSyncService → Schema

```text
@register_view + @resaas_action
        |
        v
   VIEW_REGISTRY
        |
        v
ActionSyncService.sync_registry(VIEW_REGISTRY)
        |            (sinal post_migrate / manage.py sync_actions)
        v
  ModelExtraAction + Permission   (ver security/permissions.md para as
        |                          regras de ownership manual/decorator)
        v
ResaasSchemaBuilder.build()      (por model, em tempo de pedido)
        |
        v
  Schema 1.0 "actions"
        |
        v
   quasar_resaas (frontend)
```

## Quando é que VIEW_REGISTRY é realmente preenchido

`@register_view` só corre quando o seu módulo é importado. O `urls.py`
importa todas as views (directamente ou via `views/__init__.py` de cada
app) como efeito secundário de construir o router. Um processo que nunca
toca no `ROOT_URLCONF` (um `manage.py migrate` isolado, por exemplo) pode
nunca preencher `VIEW_REGISTRY` — nesse caso, a sincronização de actions
no `post_migrate` não faz nada silenciosamente. Isto é uma limitação
conhecida, não algo que se possa contornar sem tocar na app em si.
