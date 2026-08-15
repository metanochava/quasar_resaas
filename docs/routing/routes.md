# Router e Rotas

Cada módulo pode exportar as suas rotas:

``` javascript
export let saudeRoutes = [
  ...pacienteRoutes,
  ...consultaRoutes,
  ...receitamedicaRoutes
]
```

## Navegação por nome

``` javascript
router.push({
  name: 'view_paciente',
  params: {
    id: pacienteResponse.id
  }
})
```

## Recomendações

-   nomes de rota únicos;
-   imports corretos;
-   evitar redirects circulares;
-   validar lazy imports;
-   manter fallback para rotas inexistentes.
