// metro.config.js
// ============================================================
// EVERIA — Metro configuration
//
// Interception globale des imports :
//
//   import { Image } from 'expo-image';
//
// dans les fichiers de l'application.
//
// Tous les imports sont redirigés vers :
//
//   src/components/ui/SecureImage.js
//
// Le wrapper importe lui-même la vraie librairie expo-image.
// Pour éviter une boucle de résolution, son propre import est
// explicitement laissé à la résolution Metro native.
// ============================================================

const {
  getDefaultConfig,
} = require(
  '@expo/metro-config'
);

const path =
  require('path');

const projectRoot =
  __dirname;

const config =
  getDefaultConfig(
    projectRoot
  );

const secureImageModule =
  path.resolve(
    projectRoot,
    'src/components/ui/SecureImage.js'
  );

const defaultResolveRequest =
  config.resolver
    .resolveRequest;

config.resolver.resolveRequest =
  (
    context,
    moduleName,
    platform
  ) => {
    /*
     * Tous les imports expo-image de l'application sont
     * redirigés vers SecureImage.
     */
    if (
      moduleName ===
        'expo-image' &&
      path.resolve(
        context.originModulePath
      ) !==
        secureImageModule
    ) {
      return {
        type:
          'sourceFile',

        filePath:
          secureImageModule,
      };
    }

    /*
     * Lorsqu'on est à l'intérieur de SecureImage.js, on laisse
     * Metro résoudre la vraie librairie expo-image.
     */
    if (
      defaultResolveRequest
    ) {
      return defaultResolveRequest(
        context,
        moduleName,
        platform
      );
    }

    return context.resolveRequest(
      context,
      moduleName,
      platform
    );
  };

module.exports =
  config;