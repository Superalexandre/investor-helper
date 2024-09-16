import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { users as usersSchema } from "./schema/users.js"
import { wallet as walletSchema } from "./schema/users.js"
import { walletSymbols as walletSymbolsSchema } from "./schema/users.js"
import bcrypt from "bcrypt"
import crypto from "node:crypto"

// node --loader ts-node/esm ./db/createAll.ts -u test -p test -m test@gmail.com

// Définir les arguments attendus
const argv = yargs(hideBin(process.argv))
    .option("mail", {
        alias: "m",
        type: "string",
        description: "Email de l'utilisateur",
        demandOption: true, // Rend ce champ obligatoire
    })
    .option("password", {
        alias: "p",
        type: "string",
        description: "Mot de passe de l'utilisateur",
        demandOption: true, // Rend ce champ obligatoire
    })
    .option("username", {
        alias: "u",
        type: "string",
        description: "Nom d'utilisateur",
        demandOption: true, // Rend ce champ obligatoire
    })
    .help()
    .alias("help", "h")
    .argv

async function createUser() {
    const { username, password, mail } = await argv

    const sqlite = new Database("./db/sqlite.db")
    const db = drizzle(sqlite)

    
    const saltRound = 10
    const genSalt = await bcrypt.genSalt(saltRound)
    const passwordHash = await bcrypt.hash(password, genSalt)

    const algorithm = "aes-256-cbc"
    const key = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, key, iv)

    // Encrypt the mail
    let encrypted = cipher.update(mail, "utf8", "hex")
    encrypted += cipher.final("hex")


    const user = await db
        .insert(usersSchema)
        .values({
            username: username,
            firstName: username,
            lastName: username,
            email: encrypted,
            password: passwordHash,
            salt: genSalt
        })
        .returning({
            id: usersSchema.id,
        })

    console.log("User created", user)
    const idUser = user[0].id


    const wallet = await db
        .insert(walletSchema)
        .values({
            userId: idUser,
            name: "Portefeuille"
        })
        .returning({
            walletId: walletSchema.walletId,
        })

    console.log("Wallet created", wallet)
    const walletId = wallet[0].walletId

    const symbols = [
        "EURONEXT:CHIP",
        "NASDAQ:AAPL",
        "BITSTAMP:ETHUSD",
        "BITSTAMP:BTCUSD",
        "TVC:CAC40",
        "EURONEXT:RNO",
        "NASDAQ:NVDA"
    ]

    
    for (const symbol of symbols) {
        console.log(symbol)

        await db
            .insert(walletSymbolsSchema)
            .values({
                walletId: walletId,
                symbol: symbol,
                quantity: 0
            })
    }

}

createUser()
