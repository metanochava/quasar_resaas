// Compatibilidade: a lógica de aplicação de tema/layout/tipografia/
// animação foi organizada (um conceito por ficheiro) em ../theme/ -
// ver theme/setSettings.js, applyTheme.js, applyLayout.js,
// applyTypography.js, applyAnimation.js. Este ficheiro mantém-se como
// re-export para não quebrar quem já importa `setSettings` a partir
// daqui (stores/UserStore.js, e index.js da biblioteca).
export { setSettings } from '../theme/index.js'
