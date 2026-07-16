module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        console: "readonly",
        navigator: "readonly"
      }
    },
    rules: {}
  }
];
