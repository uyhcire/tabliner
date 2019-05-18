module.exports = {
  roots: ["src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  globals: {
    "ts-jest": {
      diagnostics: false
    }
  }
};
