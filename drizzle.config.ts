import { defineConfig } from "drizzle-kit"
import type { Config } from "drizzle-kit"

const config: Config = {
    schema: "./db/schema/*",
    out: "./db/migrations",
    dialect: "sqlite",

    verbose: true,
    strict: true,
}

export default defineConfig(config)