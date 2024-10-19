import type { News, NewsArticle as NewsArticleSchema } from "../../db/schema/news"

interface NewsSymbolsArticle {
	id: string
	title: string
	storyPath: string
	sourceLogoId: string
	published: number
	source: string
	urgency: number
	provider: string
	link: string
	relatedSymbols: { symbol: string }[]
	article: {
		jsonDescription: string
		shortDescription: string
		importanceScore: number
		copyright: string
	}
}

interface NewsArticle {
	news: News
	// biome-ignore lint/style/useNamingConvention: <explanation>
	news_article: NewsArticleSchema
}

interface NewsSymbols {
	news: News
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Type
	relatedSymbols: any
}

interface NewsFull {
    news: News
    news_article: NewsArticleSchema
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Type
    relatedSymbols: any
}

interface NewsSymbolsChildArticle {
	news: {
		news: News
		news_article: NewsArticleSchema
	}
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Type
	relatedSymbols: any
}

export type {
    NewsSymbolsArticle,
    NewsArticle,
    NewsSymbols,
    NewsFull,
	NewsSymbolsChildArticle
}