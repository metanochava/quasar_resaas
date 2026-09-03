# Git Flow e Releases

Um fluxo `develop` → `release/x.y.z` → `main`, com tag no merge. Não há nenhum script de release
neste repositório — esta página documenta a convenção, verificada à mão ou em CI.

## Antes de começar uma release

Verificar sempre primeiro se já existe uma release aberta:

```bash
git branch -a | grep release
```

> [!WARNING]
> Começar uma segunda branch de release enquanto outra ainda está aberta é a forma mais
> comum deste processo correr mal — ver
> [Troubleshooting](../troubleshooting/common-errors.md#já-existe-uma-branch-de-release).

## Fluxo

```text
develop
   |
   v
release/x.y.z
   |
   +--> main       (merge - isto é o que vai para produção)
   |
   +--> develop    (merge de volta - mantém a develop atualizada com correções da própria release)
   |
   +--> tag        (vx.y.z, na main, depois do merge)
```

## Versão

A versão do pacote vive em `pyproject.toml`:

```bash
grep version pyproject.toml
# version = "0.0.461"
```

## Regra importante

> [!WARNING]
> Subir a versão **depois** de confirmar que não há nenhuma release pendente, nunca antes.
> Um commit de subida de versão feito antes de verificar pode acabar na `develop` sem
> nenhuma branch de release correspondente para o transportar — a versão passa então a dizer
> uma coisa enquanto o código realmente lançado diz outra.

## Diagnóstico

```bash
git status
git branch -a
git tag --sort=-v:refname | head
grep version pyproject.toml
```

Se existir uma branch de release que não devia (já feita merge, abandonada), resolvê-la ou
apagá-la explicitamente em vez de começar uma nova ao lado dela — uma branch de release esquecida
vai continuar a disparar a verificação de "já existe" para quem a corra a seguir.
