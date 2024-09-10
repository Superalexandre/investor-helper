// import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

// export const events = sqliteTable("events", {
//     id: text("id")
//         .primaryKey()
//         .unique(),
//     start: int("start")
//         .notNull(),
//     end: int("end")
//         .notNull(),
//     title: text("title")
//         .notNull(),
//     description: text("description")
//         .notNull(),
//     location: text("location"),
//     url: text("url"),
//     importance: int("importance")
//         .notNull(),
//     source: text("source"),
//     sourceUrl: text("source_url"),
// })

// export type Events = typeof events.$inferSelect
