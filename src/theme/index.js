// src/theme/index.js
// Point d'entrée unique du design system. Toujours importer le thème
// depuis "@/theme" plutôt que depuis "@/theme/theme" directement.

import theme from './theme';

export default theme;
export * from './theme';
export { useEveriaFonts } from './fonts';
