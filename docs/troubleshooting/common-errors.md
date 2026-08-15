# Troubleshooting Frontend

## Maximum call stack size exceeded

Investigar:

-   componente que renderiza a si próprio;
-   watcher que altera o mesmo valor observado;
-   chamadas recursivas entre stores;
-   redirects circulares;
-   wrappers com import incorreto.

## Cannot read properties of undefined (reading '\$refs')

Verificar se a ref existe depois do componente ser montado e evitar
aceder a `$refs` prematuramente no `setup()`.

## QPage needs to be child of QPageContainer

Garantir:

``` text
q-layout
  -> q-page-container
     -> router-view
        -> q-page
```

## Asset 404

Para assets importados pelo bundler:

``` javascript
import video from '../images/video.mp4'
```

e:

``` vue
<source :src="video" type="video/mp4">
```

Para ficheiros públicos, utilizar o caminho correspondente à pasta
pública da aplicação.
