import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { wallet as walletSchema } from "./schema/users.js"

// node --loader ts-node/esm ./db/createWallet.ts -u UUID

// Définir les arguments attendus
const argv = yargs(hideBin(process.argv))
    .option("uuid", {
        alias: "u",
        type: "string",
        description: "UUID de l'utilisateur",
        demandOption: true, // Rend ce champ obligatoire
    })
    .help()
    .alias("help", "h")
    .argv

async function createWallet() {
    const { uuid } = await argv

    const sqlite = new Database("./db/sqlite.db")
    const db = drizzle(sqlite)

    const wallet = await db
        .insert(walletSchema)
        .values({
            userId: uuid,
            name: "Portefeuille"
        })
        .returning({
            walletId: walletSchema.walletId,
        })

    console.log("Wallet created", wallet)
}

createWallet()
