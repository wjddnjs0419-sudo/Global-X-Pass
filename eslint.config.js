import globals from "globals";
import tseslint from "typescript-eslint";

const piiDirectQueryPattern = /profiles\([^)]*\b(?:name|email)\b/i;

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${piiDirectQueryPattern.source}/]`,
          message:
            "Do not directly query PII fields from profiles. Use decrypt-profiles or another approved Edge Function.",
        },
        {
          selector: `TemplateElement[value.raw=/${piiDirectQueryPattern.source}/]`,
          message:
            "Do not directly query PII fields from profiles. Use decrypt-profiles or another approved Edge Function.",
        },
      ],
    },
  }
);
