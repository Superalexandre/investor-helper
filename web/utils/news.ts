import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { newsSchema, newsRelatedSymbolsSchema, newsArticleSchema } from "../../db/schema/news.js"
import { symbolsSchema } from "../../db/schema/symbols.js"
import { and, desc, eq, gt, gte, inArray, like, lt, lte, or } from "drizzle-orm"
import config from "../../config.js"

import refreshSymbol from "./refreshSymbol.js"
import { parse } from "node-html-parser"
import {
	notificationSchema,
	notificationSubscribedNewsSchema,
	notificationSubscribedNewsKeywordsSchema,
	notificationSubscribedNewsSymbolsSchema
} from "../../db/schema/notifications.js"
import { sendNotification } from "./notifications.js"
import type { NewsSymbols, NewsSymbolsArticle } from "../types/News.js"
import i18n, { newsUrl } from "../app/i18n.js"

async function getNews({ page = 1, limit = 10, language, scores }: { page?: number; limit?: number, language?: string[], scores?: number[][] }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	// Score is an array of double array, the first element is the minimum score and the second element is the maximum score

	const allNews = await db
		.select()
		.from(newsSchema)
		.where(and(
			language ? inArray(newsSchema.lang, language) : undefined,
			scores ? or(...scores.map((score) => and(gt(newsSchema.importanceScore, score[0]), lt(newsSchema.importanceScore, score[1])))) : undefined
		))
		.limit(limit)
		.offset(limit * (page - 1))
		.orderBy(desc(newsSchema.published))

	const news: NewsSymbols[] = []
	for (const newsItem of allNews) {
		const relatedSymbols = await db
			.select()
			.from(newsRelatedSymbolsSchema)
			.innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))
			.where(eq(newsRelatedSymbolsSchema.newsId, newsItem.id))

		news.push({
			news: newsItem,
			relatedSymbols: relatedSymbols
		})
	}

	return news
}

async function getNewsById({ id }: { id: string }) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	// Get the news from the database
	const newsResults = await db
		.select()
		.from(newsSchema)
		.innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
		.where(eq(newsSchema.id, id))
	const news = newsResults[0]

	// Get the related symbols
	const relatedSymbolsResults = await db
		.select()
		.from(newsRelatedSymbolsSchema)
		.where(eq(newsRelatedSymbolsSchema.newsId, id))
		.innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))

	return {
		news,
		relatedSymbols: relatedSymbolsResults
	}
}

async function fetchNews(lang = "fr-FR") {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const urlLang = newsUrl[lang]

	const response = await fetch(urlLang.news)
	const data = await response.text()

	const root = parse(data)

	// Get the script tag with type="application/prs.init-data+json" inside of the div data-id="react-root"
	const rawNews = root.querySelector("div[data-id='react-root'] script[type='application/prs.init-data+json']")?.text

	if (!rawNews) {
		return console.error("No news found")
	}

	const jsonNews = JSON.parse(rawNews)
	const dynamicKey = Object.keys(jsonNews)[0]

	const json = jsonNews[dynamicKey]

	if (!json) {
		return console.error("No news found")
	}

	const news = json.blocks[0].news.items

	if (!news || news.length === 0) {
		return console.error("No news found")
	}

	// Make a deep copy of the news array
	const newsCopy: NewsSymbolsArticle[] = [...news]

	for (const newsItem of newsCopy) {
		const exists = await db.select().from(newsSchema).where(eq(newsSchema.id, newsItem.id))

		if (exists.length > 0) {
			continue
		}

		const url = new URL(urlLang.originLocale + newsItem.storyPath)

		const fullArticle = await fetch(url, {
			headers: {
				"User-Agent":
					// biome-ignore lint/nursery/noSecrets: User agent
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
				// biome-ignore lint/style/useNamingConvention: Headers
				Accept: "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.9",
				// biome-ignore lint/style/useNamingConvention: Headers
				Connection: "keep-alive",

				// biome-ignore lint/style/useNamingConvention: Headers
				Referer: urlLang.originLocale,
				// biome-ignore lint/style/useNamingConvention: Headers
				Origin: urlLang.originLocale
			}
		})

		const articleData = await fullArticle.text()
		const articleRoot = parse(articleData)

		const article = articleRoot.querySelector(
			"div[class='tv-content'] script[type='application/prs.init-data+json']"
		)?.text

		if (!article) {
			return console.error("No article found")
		}

		const articleJson = JSON.parse(article)
		const dynamicKeyArticle = Object.keys(articleJson)[0]

		const jsonArticle = articleJson[dynamicKeyArticle]

		if (!jsonArticle) {
			return console.error("No article found (jsonArticle)")
		}

		const jsonDescription = JSON.stringify(jsonArticle.story.astDescription)

		const importanceScore = getNewsImportanceScore(
			jsonDescription,
			jsonArticle.story.astDescription,
			newsItem.relatedSymbols
		)

		newsItem.language = lang

		newsItem.article = {
			// htmlDescription: htmlDescription,
			// textDescription: textDescription,
			jsonDescription: jsonDescription,
			shortDescription: jsonArticle.story.shortDescription,
			copyright: jsonArticle.story.copyright,
			importanceScore: importanceScore
		}
	}

	return newsCopy as NewsSymbolsArticle[]
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function
async function saveFetchNews() {
	console.log("Fetching news")

	// const sqlite = new Database("./db/sqlite.db")
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const languages = i18n.supportedLngs

	const newsList: NewsSymbolsArticle[] = []
	// const newsList = 
	await Promise.all(
		languages.map(async (lang) => {
			const news = await fetchNews(lang)

			if (!news) {
				return
			}

			newsList.push(...news)
		})
	)

	// const newsList = await fetchNews()
	if (!newsList) {
		return
	}

	// biome-ignore lint/suspicious/noEvolvingTypes: TODO: Type
	const newsValues = []
	// biome-ignore lint/suspicious/noEvolvingTypes: TODO: Type
	const newsRelatedSymbolsValues = []
	// biome-ignore lint/suspicious/noEvolvingTypes: TODO: Type
	const newsArticleValues = []

	const allNotifications: NotificationToSend[] = []

	for (const news of newsList) {
		// Check if the news already exists
		const exists = await db.select().from(newsSchema).where(eq(newsSchema.id, news.id))

		// Insert only if the news does not exist (to refresh the symbols)
		if (exists.length === 0) {
			newsValues.push({
				id: news.id,
				title: news.title,
				storyPath: news.storyPath,
				sourceLogoId: news.sourceLogoId,
				published: news.published,
				source: news.source,
				urgency: news.urgency,
				provider: news.provider,
				link: news.link,
				mainSource: "tradingview",
				lang: news.language,
				importanceScore: news.article.importanceScore
			})
		}

		if (news.relatedSymbols && news.relatedSymbols.length > 0) {
			for (const symbol of news.relatedSymbols) {
				await refreshSymbol({ symbolId: symbol.symbol })

				if (exists.length === 0) {
					newsRelatedSymbolsValues.push({
						newsId: news.id,
						symbol: symbol.symbol
					})
				}
			}
		}

		if (news.article && exists.length === 0) {
			newsArticleValues.push({
				newsId: news.id,
				date: news.published,
				jsonDescription: news.article.jsonDescription,
				shortDescription: news.article.shortDescription,
				copyright: news.article.copyright
			})
		}

		if (exists.length === 0) {
			const notification = await getNotificationNews(news)

			if (notification) {
				allNotifications.push(...notification)
			}
		}
	}

	if (newsValues.length > 0) {
		await db.insert(newsSchema).values(newsValues)
	}

	if (newsRelatedSymbolsValues.length > 0) {
		await db.insert(newsRelatedSymbolsSchema).values(newsRelatedSymbolsValues)
	}

	if (newsArticleValues.length > 0) {
		await db.insert(newsArticleSchema).values(newsArticleValues)
	}

	if (allNotifications.length > 0) {
		reduceAndSendNotifications(allNotifications)
	}

	console.log(
		`Inserted ${newsValues.length} news, ${newsRelatedSymbolsValues.length} related symbols and ${newsArticleValues.length} articles`
	)
}

interface NotificationToSend {
	number: number

	keyword: string[]
	newsId: string[]

	userId: string
	notificationId: string

	title: string
	body: string
	data: {
		url: string
	}
}

async function getNotificationNews(news: NewsSymbolsArticle) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const titleWords = news.title.split(" ").map((word) => word.toLowerCase())

	let shortDescriptionWords: string[] = []
	if (news.article?.shortDescription) {
		shortDescriptionWords = news.article.shortDescription.split(" ").map((word) => word.toLowerCase())
	}

	let longDescriptionWords: string[] = []
	if (news.article?.jsonDescription) {
		let articleText = ""
		// biome-ignore lint/suspicious/noExplicitAny:
		const flatten = (node: any) => {
			// console.log(node)
			if (typeof node === "string") {
				articleText += node.toLowerCase()

				return
			}

			if (node.children) {
				for (const child of node.children) {
					flatten(child)
				}
			}
		}

		flatten(JSON.parse(news.article.jsonDescription))

		longDescriptionWords = articleText.split(" ")
	}

	// Send a notification to the users that are subscribed to the news keywords
	const keywords = await db
		.select()
		.from(notificationSubscribedNewsKeywordsSchema)
		.where(
			or(
				inArray(notificationSubscribedNewsKeywordsSchema.keyword, titleWords),
				inArray(notificationSubscribedNewsKeywordsSchema.keyword, shortDescriptionWords),
				inArray(notificationSubscribedNewsKeywordsSchema.keyword, longDescriptionWords)
			)
		)

	let symbolsArticle: string[] = []
	if (news.relatedSymbols) {
		symbolsArticle = news.relatedSymbols.map((symbol) => symbol.symbol)
	}

	const symbols = await db
		.select()
		.from(notificationSubscribedNewsSymbolsSchema)
		.where(inArray(notificationSubscribedNewsSymbolsSchema.symbol, symbolsArticle))

	const notificationsToSend: NotificationToSend[] = []
	if (keywords.length > 0 || symbols.length > 0) {
		for (const { keyword, notificationId } of keywords) {
			const notificationInfo = await db
				.select()
				.from(notificationSubscribedNewsSchema)
				.innerJoin(notificationSchema, eq(notificationSchema.userId, notificationSubscribedNewsSchema.userId))
				.where(eq(notificationSubscribedNewsSchema.notificationId, notificationId))

			notificationsToSend.push({
				number: 1,
				userId: notificationInfo[0].notifications.userId,
				notificationId: notificationId,
				keyword: [keyword],
				newsId: [news.id],
				title: `Un nouvel article parlant de ${keyword} a été publié`,
				body: news.title,
				data: {
					url: `/news/${news.id}?utm_source=notification`
				}
			})
		}

		return notificationsToSend
	}
}

async function reduceAndSendNotifications(notifications: NotificationToSend[] | undefined) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	if (!notifications) {
		return
	}

	const reducedNotifications: NotificationToSend[] = []

	for (const notification of notifications) {
		const exists = reducedNotifications.find(
			(notif) => notif.userId === notification.userId && notif.notificationId === notification.notificationId
		)

		// Prevent duplicates news
		if (exists?.newsId.includes(notification.newsId[0])) {
			exists.keyword.push(...notification.keyword)

			continue
		}

		if (exists) {
			exists.number++

			exists.newsId.push(...notification.newsId)
			// if (exists.number > 1) {
			// 	exists.title = `${exists.number} articles qui pourrais vous intéresser ont été publiés`

			// 	exists.body = `${exists.number} articles qui pourrais vous intéresser ont été publiés`

			// }
		} else {
			reducedNotifications.push(notification)
		}
	}

	for (const notificationContent of reducedNotifications) {
		const notificationsInfo = await db
			.select()
			.from(notificationSchema)
			.where(eq(notificationSchema.userId, notificationContent.userId))

		if (notificationContent.newsId.length > 1) {
			const newsIds = notificationContent.newsId.join("-")
			const newsIdsBase64 = Buffer.from(newsIds).toString("base64url")

			const newsNumber = notificationContent.newsId.length

			if (newsNumber > 1) {
				notificationContent.title = `${newsNumber} articles qui pourrais vous intéresser ont été publiés`
				notificationContent.body = `${newsNumber} articles qui pourrais vous intéresser ont été publiés`
			}

			if (notificationContent.keyword.length > 1) {
				// const originalTitle = notificationContent.title

				notificationContent.title = `${newsNumber} articles parlant de ${notificationContent.keyword.join(", ")} a été publiés`
				notificationContent.body = `${newsNumber} articles parlant de ${notificationContent.keyword.join(", ")} a été publiés`
				// notificationContent.body = `${notificationContent.number} articles parlant de ${notificationContent.keyword.join(", ")} ont été publiés`
			}

			notificationContent.data.url = `/news/focus/${newsIdsBase64}?utm_source=notification`
		}

		for (const notificationInfo of notificationsInfo) {
			sendNotification({
				title: notificationContent.title,
				body: notificationContent.body,
				data: notificationContent.data,
				auth: notificationInfo.auth,
				endpoint: notificationInfo.endpoint,
				p256dh: notificationInfo.p256dh
			})
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNewsImportanceScore(
	description: string,
	// biome-ignore lint/suspicious/noExplicitAny:
	article: any,
	relatedSymbols: unknown[]
) {
	let score = 0

	const importantKeywords = ["annonce", "décision", "plan", "changement", "crise"]

	for (const keyword of importantKeywords) {
		if (description.toLowerCase().includes(keyword)) {
			score += 10
		}
	}

	// Flatten the article tex
	let articleText = ""
	// biome-ignore lint/suspicious/noExplicitAny:
	const flatten = (node: any) => {
		// console.log(node)
		if (typeof node === "string") {
			articleText += node
		}

		if (node.children) {
			for (const child of node.children) {
				flatten(child)
			}
		}
	}

	flatten(article)

	// biome-ignore lint/suspicious/noExplicitAny:
	const getRelatedSymbols = (node: any) => {
		if (node.type === "symbol") {
			score += 5

			// symbolCount++
		}

		if (node.children) {
			for (const child of node.children) {
				getRelatedSymbols(child)
			}
		}
	}

	getRelatedSymbols(article)

	const wordCount = articleText.split(" ").length

	if (wordCount > 300) {
		score += 20
	} else if (wordCount > 100) {
		score += 10
	}

	const highImpactKeywords = ["hausse", "baisse", "chute", "augmentation", "diminution"]

	for (const keyword of highImpactKeywords) {
		if (articleText.toLowerCase().includes(keyword)) {
			score += 15
		}
	}

	// Add 5 points for each related symbol
	score += relatedSymbols ? relatedSymbols.length * 5 : 0

	// console.log(`Score: ${score}, word count: ${wordCount}, symbol count: ${symbolCount}, related symbols: ${relatedSymbols ? relatedSymbols.length : 0}`)

	return score
}

async function searchNews(search: string, limit = 10) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const news = await db
		.select({
			id: newsSchema.id,
			title: newsSchema.title,
			storyPath: newsSchema.storyPath,
			sourceLogoId: newsSchema.sourceLogoId,
			published: newsSchema.published,
			source: newsSchema.source,
			urgency: newsSchema.urgency,
			provider: newsSchema.provider,
			link: newsSchema.link,
			mainSource: newsSchema.mainSource,
			lang: newsSchema.lang,
			importanceScore: newsSchema.importanceScore
		})
		.from(newsSchema)
		.innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
		.where(
			or(
				like(newsSchema.title, `%${search}%`),
				like(newsArticleSchema.shortDescription, `%${search}%`),
				like(newsArticleSchema.jsonDescription, `%${search}%`)
			)
		)
		.orderBy(desc(newsSchema.published))
		.limit(limit)

	return news
}

async function getNewsFromDates(from: number, to: number) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const news = await db
		.select({
			title: newsSchema.title,
			published: newsSchema.published,
			article: newsArticleSchema.jsonDescription,
			description: newsArticleSchema.shortDescription
		})
		.from(newsSchema)
		.innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
		.where(
			and(
				eq(newsSchema.lang, "fr-FR"),
				gte(newsSchema.importanceScore, 20),
				gte(newsSchema.published, from),
				lte(newsSchema.published, to)
			)
		)

	return news
}

async function getLastImportantNews(from: Date, to: Date, importance: number, limit: number) {
	const sqlite = new Database("../db/sqlite.db")
	const db = drizzle(sqlite)

	const fromConvert = from.getTime() / 1000
	const toConvert = to.getTime() / 1000

	const news = await db
		.select()
		.from(newsSchema)
		.innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
		.where(
			and(
				eq(newsSchema.lang, "fr-FR"),
				gte(newsSchema.importanceScore, importance),
				gte(newsSchema.published, fromConvert),
				lte(newsSchema.published, toConvert)
			)
		)
		.limit(limit)
		.orderBy(desc(newsSchema.published))

	return news
}

export default getNews
export {
	getNews,
	getNewsById,
	fetchNews,
	saveFetchNews,
	getNewsImportanceScore,
	searchNews,
	getNewsFromDates,
	getLastImportantNews
}
