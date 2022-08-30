module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  strict: "off",
  rules: {
    quotes: ["error", "double"],
  },
};
