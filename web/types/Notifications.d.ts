import type {
	NotificationSubscribedNews,
	NotificationSubscribedNewsKeywords,
	NotificationSubscribedNewsSymbols
} from "../../db/schema/notifications"

interface NotificationSubscribedFullNews extends NotificationSubscribedNews {
	keywords: NotificationSubscribedNewsKeywords[]
	symbols: NotificationSubscribedNewsSymbols[]
}

export type { NotificationSubscribedFullNews }
