import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { walletSymbols as walletSymbolsSchema } from "./schema/users.js"

/*
"EURONEXT:CHIP"
"NASDAQ:AAPL"
"BITSTAMP:ETHUSD"
"BITSTAMP:BTCUSD"
"TVC:CAC40"
"EURONEXT:RNO"
"NASDAQ:NVDA"
*/
// node --loader ts-node/esm ./db/addSymbols.ts -u 4d7d2bfb-0ae4-4f74-99a8-b112e441be2f -n EURONEXT:CHIP -n NASDAQ:AAPL -n BITSTAMP:ETHUSD -n BITSTAMP:BTCUSD -n TVC:CAC40 -n EURONEXT:RNO -n NASDAQ:NVDA

// Définir les arguments attendus
const argv = yargs(hideBin(process.argv))
    .option("uuid", {
        alias: "u",
        type: "string",
        description: "UUID du wallet",
        demandOption: true, // Rend ce champ obligatoire
    })
    .option("names", {
        alias: "n",
        type: "array",
        description: "UUID de l'utilisateur",
        demandOption: true, // Rend ce champ obligatoire
    })
    .help()
    .alias("help", "h")
    .argv

async function addSymbols() {
    const { uuid, names } = await argv

    const sqlite = new Database("./db/sqlite.db")
    const db = drizzle(sqlite)

    for (const name of names) {
        console.log(name)

        await db
            .insert(walletSymbolsSchema)
            .values({
                walletId: uuid,
                symbol: name as string,
                quantity: 0,
                currency: "USD",
            })
    }

    // const wallet = await db
    //     .insert(walletSchema)
    //     .values({
    //         userId: uuid,
    //         name: "Portefeuille"
    //     })
    //     .returning({
    //         walletId: walletSchema.walletId,
    //     })

    console.log("Wallet created")
}

addSymbols()
