import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        requestAnimationFrame: "readonly",
        Blob: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        Event: "readonly",
        File: "readonly",
        Element: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
];
