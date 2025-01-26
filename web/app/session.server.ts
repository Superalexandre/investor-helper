import { createCookieSessionStorage } from "@remix-run/node";
import { redirect } from "react-router"
import Database from "better-sqlite3"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { usersSchema, type User } from "../../db/schema/users"
import "dotenv/config"
import logger from "../../log"

const SESSION_KEY = "token"

const COOKIE_EXPIRE_NEVER = 60 * 60 * 24 * 365 * 10

const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "__session",
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secrets: [process.env.SESSION_SECRET as string],
		secure: process.env.NODE_ENV === "production",
		maxAge: COOKIE_EXPIRE_NEVER
	}
})

export async function getSession(request: Request) {
	const cookie = request.headers.get("Cookie")
	const sessionCookie = await sessionStorage.getSession(cookie)
	return sessionCookie
}

export async function logout(request: Request, redirectUrl = "/") {
	const session = await getSession(request)
	session.unset(SESSION_KEY)

	return redirect(redirectUrl, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session)
		}
	})
}

export async function createUserSession({
	request,
	token,
	redirectUrl = "/"
}: {
	request: Request
	token: string
	redirectUrl?: string
}) {
	const session = await getSession(request)
	session.set(SESSION_KEY, token)

	logger.info(`Creating session for token: ${token}`)

	return redirect(redirectUrl, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session)
		}
	})
}

export async function setSession({
	request,
	key,
	value,
	redirectUrl = "/"
}: {
	request: Request
	key: string
	value: unknown
	redirectUrl?: string
}) {
	const session = await getSession(request)
	session.set(key, value)

	return redirect(redirectUrl, {
		headers: {
			"Set-Cookie": await sessionStorage.commitSession(session)
		}
	})
}

export async function clearCache({
	request,
	redirectUrl = "/"
}: {
	request: Request
	redirectUrl?: string
}) {
	const session = await getSession(request)

	return redirect(redirectUrl, {
		headers: {
			"Set-Cookie": await sessionStorage.destroySession(session)
		}
	})
}

export async function getUserToken(request: Request): Promise<string | null> {
	const session = await getSession(request)
	const token: string = session.get(SESSION_KEY)
	return token
}

export async function getUser(request: Request): Promise<User | null> {
	const token = await getUserToken(request)

	if (!token) {
		return null
	}

	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const users = await db.select().from(usersSchema).where(eq(usersSchema.token, token))

	if (!users || users.length === 0 || !users[0]) {
		return null
	}

	const user = users[0]

	logger.success(`User found: ${user.username} (${user.id})`)

	return user as User
}

export async function getUserByToken(token: string): Promise<User | null> {
	const sqlite = new Database("../db/sqlite.db", { fileMustExist: true })
	const db = drizzle(sqlite)

	const users = await db.select().from(usersSchema).where(eq(usersSchema.token, token))

	if (!users || users.length === 0 || !users[0]) {
		return null
	}

	const user = users[0]

	logger.success(`User found by token: ${user.username} (${user.id})`)

	return user as User
}

export { sessionStorage }
