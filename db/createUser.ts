import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { users as usersSchema } from "./schema/users.js"

// node --loader ts-node/esm ./createUser.ts -u test -p test -m test@gmail.com

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

    const sqlite = new Database("./sqlite.db")
    const db = drizzle(sqlite)

    const user = await db
        .insert(usersSchema)
        .values({
            firstName: username,
            lastName: username,
            email: mail,
            password
        })

    console.log("User created", user)

}

createUser()
