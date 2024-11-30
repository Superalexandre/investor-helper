import { eq } from "drizzle-orm";
import type { User } from "../../../db/schema/users"
import { usersPreferencesSchema } from "../../../db/schema/preferences"
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

async function getUserPreferences({
    user
}: {
    user: User
}) {
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    const usersPreferences = await db
        .select()
        .from(usersPreferencesSchema)
        .where(eq(usersPreferencesSchema.userId, user.id))

    if (!usersPreferences || usersPreferences.length === 0 || !usersPreferences[0]) {
        return null
    }

    const userPreference = usersPreferences[0]

    return userPreference
}

async function createPreferences({
    user
}: {
    user: User
}) {
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

    const preferences = await getUserPreferences({ user })

    if (preferences) {
        return preferences
    }

    console.log("Creating preferences for user", user)

    const newPreferences = await db
        .insert(usersPreferencesSchema)
        .values({
            userId: user.id
        })

    return newPreferences
}

async function checkUserPreferences({
    user
}: {
    user: User
}) {
    const preferences = await getUserPreferences({ user })

    if (!preferences) {
        return await createPreferences({ user })
    }

    return preferences
}

async function changeUserLanguage({
    user,
    language
}: {
    user: User,
    language: string
}) {
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    await checkUserPreferences({ user })

    const updatedUser = await db
        .update(usersPreferencesSchema)
        .set({
            language
        })
        .where(eq(usersPreferencesSchema.userId, user.id))

    return updatedUser
}

async function changeUserTheme({
    user,
    theme
}: {
    user: User,
    theme: string
}) {
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    await checkUserPreferences({ user })

    const updatedUser = await db
        .update(usersPreferencesSchema)
        .set({
            theme
        })
        .where(eq(usersPreferencesSchema.userId, user.id))

    return updatedUser
}

async function updateUserPreferences({
    user,
    preferences
}: {
    user: User,
    preferences: {
        theme: string,
        language: string
    }
}) {
    const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
    const db = drizzle(sqlite)

    await checkUserPreferences({ user })

    const updatedUser = await db
        .update(usersPreferencesSchema)
        .set({
            theme: preferences.theme,
            language: preferences.language
        })
        .where(eq(usersPreferencesSchema.userId, user.id))

    return updatedUser
}

export {
    getUserPreferences,
    createPreferences,
    changeUserLanguage,
    changeUserTheme,
    updateUserPreferences
}