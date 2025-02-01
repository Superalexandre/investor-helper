import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resetPasswordEmailSchema = sqliteTable("reset_password_email", {
    email: text("email").unique().notNull(),
    token: text("token").unique().notNull(),
    createdAt: text("created_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString())
});

export type ResetPasswordEmail = typeof resetPasswordEmailSchema.$inferSelect;