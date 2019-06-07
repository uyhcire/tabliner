module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    "jest/globals": true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript"
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    chrome: "readonly"
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: ["react", "@typescript-eslint", "react-hooks", "jest", "import"],
  rules: {
    indent: "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/array-type": ["error", "generic"],
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      { allowExpressions: true }
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "import/no-unresolved": "error",
    "import/no-unused-modules": "error",
    "import/no-nodejs-modules": "error",
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/extensions": [
      "error",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never"
      }
    ],
    "import/order": [
      "error",
      {
        "newlines-between": "always"
      }
    ],
    "import/newline-after-import": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          // Substitute for import/no-relative-parent-imports, which gives false positives with plugin:import/typescript
          "../*",
          // Don't allow relative imports, even from the same directory
          "./*"
        ]
      }
    ],
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.name='mount']",
        message: "Use `safeMount` instead of Enzyme's `mount`"
      }
    ]
  },
  settings: {
    "import/resolver": {
      node: {
        paths: ["src"]
      }
    },
    react: {
      version: "detect"
    }
  }
};
