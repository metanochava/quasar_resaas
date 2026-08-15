# Tradução

O helper `tdc()` é utilizado para traduzir textos da interface.

Exemplo:

``` vue
{{ tdc('Paciente') }}
```

ou:

``` javascript
import { tdc } from 'quasar_resaas'
```

Os componentes reutilizáveis devem preferir labels traduzíveis em vez de
strings rígidas quando fizer sentido.
