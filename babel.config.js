module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Alias "@/..." vers "src/..." pour des imports propres dans tout le projet
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@app": "./app",
          },
        },
      ],
      "react-native-reanimated/plugin", // doit rester le dernier plugin de la liste
    ],
  };
};
