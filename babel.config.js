module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ['react-native-reanimated/plugin'],
      ["inline-import", { extensions: [".sql"] }],
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],
    ], // <-- add this
  };
};
