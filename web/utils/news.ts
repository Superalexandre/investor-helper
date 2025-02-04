import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { newsSchema, newsRelatedSymbolsSchema, newsArticleSchema } from "../../db/schema/news.js"
import { symbolsSchema } from "../../db/schema/symbols.js"
import { and, desc, eq, gt, gte, inArray, like, lt, lte, or, sql } from "drizzle-orm"

import refreshSymbol from "./refreshSymbol.js"
import { parse } from "node-html-parser"
import {
	notificationSchema,
	notificationSubscribedNewsSchema,
	notificationSubscribedNewsKeywordsSchema,
	notificationSubscribedNewsSymbolsSchema
} from "../../db/schema/notifications.js"
import { addNotificationList, sendNotification } from "./notifications.js"
import type { NewsFull, NewsSymbolsArticle } from "../types/News.js"
import i18n, { newsUrl } from "../app/i18n.js"
import logger from "../../log/index.js"

const sqlite = new Database("../db/sqlite.db")
const db = drizzle(sqlite)

async function getNews({
	page = 1,
	limit = 10,
	language,
	scores,
	sources
}: { page?: number; limit?: number; language?: string[]; scores?: number[][]; sources?: string[] }) {
	// Fetch all news items with the given filters
	const allNews = await db
		.select()
		.from(newsSchema)
		.innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))
		.where(
			and(
				language ? inArray(newsSchema.lang, language) : undefined,
				scores
					? or(
							...scores.map((score) =>
								and(gt(newsSchema.importanceScore, score[0]), lt(newsSchema.importanceScore, score[1]))
							)
						)
					: undefined,
				sources ? inArray(sql<string>`lower(${newsSchema.source})`, sources) : undefined
			)
		)
		.limit(limit)
		.offset(limit * (page - 1))
		.orderBy(desc(newsSchema.published))

	// Extract the news IDs
	const newsIds = allNews.map((newsItem) => newsItem.news.id)

	// Fetch all related symbols for the fetched news items in a single query
	const relatedSymbols = await db
		.select()
		.from(newsRelatedSymbolsSchema)
		.innerJoin(symbolsSchema, eq(newsRelatedSymbolsSchema.symbol, symbolsSchema.symbolId))
		.where(inArray(newsRelatedSymbolsSchema.newsId, newsIds))

	// Group related symbols by news ID
	const relatedSymbolsByNewsId = relatedSymbols.reduce(
		(acc, symbol) => {
			if (symbol.news_related_symbol.newsId && !acc[symbol.news_related_symbol.newsId]) {
				acc[symbol.news_related_symbol.newsId] = []
			}

			if (symbol.news_related_symbol.newsId) {
				acc[symbol.news_related_symbol.newsId].push(symbol)
			}

			return acc
		},
		{} as Record<string, typeof relatedSymbols>
	)

	// Map related symbols to the corresponding news items
	const news: NewsFull[] = allNews.map((newsItem) => ({
		news: newsItem.news,
		news_article: newsItem.news_article,
		relatedSymbols: relatedSymbolsByNewsId[newsItem.news.id] || []
	}))

	return news
}

async function getSourceList({
	languages
}: {
	languages: string[]
}): Promise<string[]> {
	const sources = await db
		.selectDistinct({
			source: sql<string>`lower(${newsSchema.source})`
		})
		.from(newsSchema)
		.where(inArray(newsSchema.lang, languages))

	const sourcesList = sources.map((source) => source.source)

	return sourcesList
}

async function getNewsById({ id }: { id: string }) {
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

async function getNewsBySymbol({ symbol, limit = 10 }: { symbol: string; limit?: number }) {
	const newsResults = await db
		.select({
			news: newsSchema,
			relatedSymbols: newsRelatedSymbolsSchema
		})
		.from(newsSchema)
		.innerJoin(newsRelatedSymbolsSchema, eq(newsSchema.id, newsRelatedSymbolsSchema.newsId))
		.where(eq(newsRelatedSymbolsSchema.symbol, symbol))
		.limit(limit)
		.orderBy(desc(newsSchema.published))
	// .innerJoin(newsArticleSchema, eq(newsSchema.id, newsArticleSchema.newsId))

	return newsResults
}

async function fetchNews(lang = "fr-FR") {
	const urlLang = newsUrl[lang]

	const response = await fetch(urlLang.news)
	const data = await response.text()

	const root = parse(data)

	// Get the script tag with type="application/prs.init-data+json" inside of the div data-id="react-root"
	const rawNews = root.querySelector("div[data-id='react-root'] script[type='application/prs.init-data+json']")?.text

	if (!rawNews) {
		logger.error("No news found")

		return []
	}

	const jsonNews = JSON.parse(rawNews)
	const dynamicKey = Object.keys(jsonNews)[0]

	const json = jsonNews[dynamicKey]

	if (!json) {
		logger.error("No news found (json)")

		return []
	}

	const news = json.blocks[0].news.items

	if (!news || news.length === 0) {
		logger.error("No news found (news empty)")

		return []
	}

	// Make a deep copy of the news array
	const newsCopy: NewsSymbolsArticle[] = [...news]

	// Fetch all articles in parallel
	const articlePromises = newsCopy.map(async (newsItem) => {
		const exists = await db.select().from(newsSchema).where(eq(newsSchema.id, newsItem.id));

		if (exists.length > 0) {
			return null; // Skip if already exists
		}

		const url = new URL(urlLang.originLocale + newsItem.storyPath);

		const fullArticle = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
				"Accept": "application/json, text/javascript, */*; q=0.01",
				"Accept-Language": "en-US,en;q=0.9",
				"Connection": "keep-alive",
				"Referer": urlLang.originLocale,
				"Origin": urlLang.originLocale
			}
		});

		const articleData = await fullArticle.text();
		const articleRoot = parse(articleData);

		const article = articleRoot.querySelector("div[class='tv-content'] script[type='application/prs.init-data+json']")?.text;

		if (!article) {
			logger.error("No article found");
			return null;
		}

		const articleJson = JSON.parse(article);
		const dynamicKeyArticle = Object.keys(articleJson)[0];
		const jsonArticle = articleJson[dynamicKeyArticle];

		if (!jsonArticle) {
			logger.error("No article found (jsonArticle)");
			return null;
		}

		const jsonDescription = JSON.stringify(jsonArticle.story.astDescription);

		const importanceScore = getNewsImportanceScore(
			jsonDescription,
			jsonArticle.story.astDescription,
			newsItem.relatedSymbols
		);

		newsItem.language = lang;
		newsItem.article = {
			jsonDescription: jsonDescription,
			shortDescription: jsonArticle.story.shortDescription,
			copyright: jsonArticle.story.copyright,
			importanceScore: importanceScore
		};

		return newsItem;
	});

	// Wait for all articles to be fetched
	const results = await Promise.all(articlePromises);

	// Filter out null values (articles that already exist in the database)
	const filteredNews = results.filter(item => item !== null);

	return filteredNews;

	// return newsCopy as NewsSymbolsArticle[]
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor this function
async function saveFetchNews() {
	logger.info("Fetching news")

	const languages = i18n.supportedLngs

	const newsList: NewsSymbolsArticle[] = []
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
			let provider: string
			let logoId: string
			let source: string

			if (news.provider && typeof news.provider !== "string") {
				provider = news.provider.name
				logoId = news.provider.logo_id
				source = news.provider.name
			} else {
				provider = news.provider as string
				logoId = ""
				source = news.source ? news.source : news.provider as string
			}

			newsValues.push({
				id: news.id,
				title: news.title,
				storyPath: news.storyPath,
				sourceLogoId: logoId,
				published: news.published,
				source: source,
				urgency: news.urgency,
				provider: provider,
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
				jsonDescription: news.article.jsonDescription || "",
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
		try {
			await db.insert(newsSchema).values(newsValues)
		} catch (error) {
			logger.error("Error inserting news", error)
		}
	}

	if (newsRelatedSymbolsValues.length > 0) {
		try {
			await db.insert(newsRelatedSymbolsSchema).values(newsRelatedSymbolsValues)
		} catch (error) {
			logger.error("Error inserting related symbols", error)
		}
	}

	if (newsArticleValues.length > 0) {
		try {
			await db.insert(newsArticleSchema).values(newsArticleValues)
		} catch (error) {
			logger.error("Error inserting news article", error)
		}
	}

	if (allNotifications.length > 0) {
		reduceAndSendNotifications(allNotifications)
	}

	logger.success(
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
	const titleWords = news.title.split(" ").map((word) => word.toLowerCase())

	let shortDescriptionWords: string[] = []
	if (news.article?.shortDescription) {
		shortDescriptionWords = news.article.shortDescription.split(" ").map((word) => word.toLowerCase())
	}

	let longDescriptionWords: string[] = []
	if (news.article?.jsonDescription) {
		const parsedJson = JSON.parse(news.article.jsonDescription)

		const articleText = flatten(parsedJson)

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

		// Insert into the database
		addNotificationList({
			userId: notificationContent.userId,
			title: notificationContent.title,
			body: notificationContent.body,
			url: notificationContent.data.url,
			type: "news",
			notificationFromId: notificationContent.notificationId
		})

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
	description: string | undefined,
	// biome-ignore lint/suspicious/noExplicitAny:
	article: any,
	relatedSymbols: unknown[]
) {
	let score = 0

	const importantKeywords = ["annonce", "décision", "plan", "changement", "crise"]

	for (const keyword of importantKeywords) {
		if (description?.toLowerCase().includes(keyword)) {
			score += 10
		}
	}

	// Flatten the article tex
	const articleText = flatten(article)

	// biome-ignore lint/suspicious/noExplicitAny:
	const getRelatedSymbols = (node: any) => {
		if (node && node.type === "symbol") {
			score += 5

			// symbolCount++
		}

		if (node?.children) {
			for (const child of node.children) {
				getRelatedSymbols(child)
			}
		}

		return
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

	return score
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function flatten(nodes: any) {
	let text = ""

	if (!nodes || !nodes.children) {
		return text
	}

	if (nodes.type === "p") {
		logger.info("nodes type p", nodes)

		text += nodes.content.toLowerCase()
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const flattenNode = (node: any) => {
		if (typeof node === "string") {
			text += node.toLowerCase()

			return
		}

		if (node.children) {
			for (const child of node.children) {
				flattenNode(child)
			}
		}
	}

	for (const node of nodes.children) {
		flattenNode(node)
	}

	return text
}

async function searchNews(search: string, limit = 10) {
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
	getSourceList,
	getNews,
	getNewsById,
	fetchNews,
	saveFetchNews,
	getNewsImportanceScore,
	searchNews,
	getNewsFromDates,
	getLastImportantNews,
	getNewsBySymbol
}
