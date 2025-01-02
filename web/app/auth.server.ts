import { GoogleStrategy } from "remix-auth-google"
import { Authenticator } from "remix-auth"
import { sessionStorage } from "./session.server"

export const authenticator = new Authenticator(sessionStorage)

const googleStrategy = new GoogleStrategy({
    // biome-ignore lint/style/useNamingConvention: <explanation>
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    // biome-ignore lint/style/useNamingConvention: <explanation>
    callbackURL: "http://localhost:4000/login/auth/google/callback",
// biome-ignore lint/suspicious/useAwait: <explanation>
}, async ({ accessToken, refreshToken, extraParams, profile }) => {
    console.log({
        accessToken,
        refreshToken,
        extraParams,
        profile
    })
})

authenticator.use(googleStrategy)
