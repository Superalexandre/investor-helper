import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const verificationEmailSchema = sqliteTable("verification_email", {
    email: text("email").unique().notNull(),
    token: text("token").unique().notNull(),
    code: text("code").notNull().default("0000"),
    createdAt: text("created_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString())
});

export type VerificationEmail = typeof verificationEmailSchema.$inferSelect;