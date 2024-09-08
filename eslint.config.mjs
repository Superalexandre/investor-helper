import typescriptEslint from "@typescript-eslint/eslint-plugin"
import stylistic from "@stylistic/eslint-plugin"
import jsxA11Y from "eslint-plugin-jsx-a11y"
import tailwindcss from "eslint-plugin-tailwindcss"
import noSecrets from "eslint-plugin-no-secrets"
import globals from "globals"
import tsParser from "@typescript-eslint/parser"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
})

export default [{
    ignores: ["**/node_modules/"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    // "plugin:react/recommended",
    // "plugin:react/jsx-runtime",
    // "plugin:jsx-a11y/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@stylistic": stylistic,
        "jsx-a11y": jsxA11Y,
        tailwindcss,
        "no-secrets": noSecrets,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        // parserOptions: {
        //     project: ["./tsconfig.json"],
        // },
    },

    settings: {
        react: {
            pragma: "React",
            version: "detect",
        },

        "import/resolver": {
            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx"],
            },
        },
    },

    rules: {
        "@/semi": ["error", "never"],
        "@stylistic/no-extra-semi": ["error"],
        "@stylistic/indent": ["error", 4],

        "@stylistic/arrow-spacing": ["error", {
            before: true,
            after: true,
        }],

        "@stylistic/quotes": ["error", "double"],

        // "import/no-unresolved": ["error", {
        //     ignore: ["^@app/", "^@components/", "^@pages/", "^@styles/", "^@utils/", "^config"],
        // }],

        // "import/order": ["warn", {
        //     groups: [
        //         "builtin",
        //         "external",
        //         "internal",
        //         ["parent", "sibling"],
        //         "index",
        //         "unknown",
        //     ],

        //     "newlines-between": "always",

        //     alphabetize: {
        //         order: "asc",
        //         caseInsensitive: true,
        //     },
        // }],

        "require-await": ["error"],
        "prefer-arrow-callback": ["error"],
        "no-unneeded-ternary": ["error"],

        "no-useless-rename": ["error", {
            ignoreDestructuring: false,
            ignoreImport: false,
            ignoreExport: false,
        }],

        "no-lonely-if": ["error"],
        "no-empty-function": ["error"],
        eqeqeq: ["error", "always"],
        "@typescript-eslint/no-shadow": "error",
        camelcase: ["error"],

        // "react/jsx-filename-extension": ["warn", {
        //     extensions: [".tsx"],
        // }],

        "tailwindcss/enforces-shorthand": "error",
        "tailwindcss/classnames-order": "error",
        "tailwindcss/no-contradicting-classname": "error",

        "no-secrets/no-secrets": ["error", {
            ignoreContent: "^(http|https)?://(.*)",
        }],
    },
}]