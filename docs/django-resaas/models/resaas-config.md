# Models & `class RESAAS`

Qualquer model pode declarar uma `class RESAAS` aninhada para configurar como o framework o trata
— pesquisa, rotulagem, e cada secção configurável do [contrato Schema 1.0](../api/schema-contract.md).
Todos os atributos são opcionais; o framework recorre a um valor por omissão sensato para o que
não for definido. Nada aqui faz efeito sem o model ter também uma view registada — ver
[Criar um novo recurso](../development/creating-resource.md).

```python
class Product(BaseModel):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50)

    class RESAAS:
        label_field = "name"
        search_fields = ["name", "sku"]
        crud = True
        icon = "mdi-package-variant"
```

## `label_field` / `value_field`

`label_field` (string) nomeia o(s) campo(s) usados para construir uma representação legível da
instância — para opções de select/autocomplete, títulos de PDF, etc. Suporta vários campos,
separados por espaço, vírgula ou pipe:

```python
class RESAAS:
    label_field = "name surname"   # -> ["name", "surname"], juntos no momento de renderizar
```

`value_field` tem por omissão `"id"` e raramente precisa de ser alterado — é o campo usado como
valor subjacente na mesma representação label/value.

## `search_fields`

Lista explícita dos campos que `?search=` deve corresponder (`icontains`, unidos com OR). Suporta
travessia de relações com a sintaxe `__` do Django, desde que todos os passos exceto o último
sejam um campo de relação e o último seja um campo `Char`/`Text`/`Email`:

```python
class RESAAS:
    search_fields = ["code", "employee__person__full_name"]
```

Se omitido, a pesquisa recorre a todos os campos `Char`/`Text`/`Email` diretos **do próprio
model** — não percorre relações no modo de fallback. Declarar `search_fields` explicitamente
sempre que pesquisar através de uma relação importar. Comportamento completo em
[Pesquisa](../api/search.md).

## `crud`

Booleano, por omissão `True`. Alimenta `ui.crud` no schema — uma convenção do frontend para
"mostrar o ecrã CRUD padrão para este model". Definir como `False` não desativa a API em si, só
sinaliza a uma UI orientada por schema que este model não deve ganhar um ecrã CRUD genérico.

## `icon`

String (ex.: um nome de ícone Quasar/Material como `"mdi-package-variant"`), passada diretamente
para `ui.icon` no schema. `None` se não definido.

## `routes`

Dicionário que sobrepõe a convenção por omissão `{verbo}_{model}` para nomes de rota — fundido
sobre o valor por omissão, não substituído (definir uma chave deixa as restantes no seu valor por
omissão):

```python
class RESAAS:
    routes = {"list": "browse_product"}   # só "list" muda; add/change/view ficam por omissão
```

## `ui`, `filters`, `pagination`, `pdf`

Cada um é um dicionário, fundido superficialmente sobre os valores por omissão da respetiva secção
no schema — ver [O contrato Schema 1.0](../api/schema-contract.md) para a forma exata por omissão
de cada um e o que cada chave controla. Por exemplo, para mudar o tamanho de página por omissão e
desativar a exportação em PDF da lista para um model:

```python
class RESAAS:
    pagination = {"page_size": 25}
    pdf = {"list": False}
```

## Recomendação

Declarar `search_fields` explicitamente em qualquer model com mais do que uns poucos campos de
texto, ou onde pesquisar através de uma relação importa — confiar no fallback automático muda
silenciosamente o comportamento assim que um novo `CharField` é acrescentado ao model.
