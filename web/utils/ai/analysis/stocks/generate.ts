import fs from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import model from "../../model"
import { fetchSymbol } from "../../../tradingview/request"
import { getNewsBySymbol } from "../../../news"
import logger from "../../../../../log"

//node --loader ts-node/esm ./utils/ai/analysis/stocks/generate.ts

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Analysis {
	recommendation: string
	confidence: number
	fr: {
		beginner: {
			reason: string
		}
		advanced: {
			reason: string
		}
	}
	en: {
		beginner: {
			reason: string
		}
		advanced: {
			reason: string
		}
	}
}

export async function generateAnalysis({
	symbol,
	language
}: {
	symbol: string
	language?: string
}): Promise<{
	text: string
	json: Analysis
} | null> {
	logger.info(`Getting data for symbol ${symbol}`)

	const [data, news] = await Promise.all([
		getInfo({ symbol: symbol, language: language }),
		getNewsBySymbol({ symbol: symbol, limit: 15 })
	])

	const formattedData = {
		technicalData: data,
		recentNews: news.map((newsItem) => newsItem.news)
	}

	logger.success("Data fetched successfully")

	try {
		let prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8")
		prompt = prompt.replace(/{{dataJson}}/g, JSON.stringify(formattedData))

		logger.info(`Generating the analysis for ${symbol}`)

		const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${process.env.OPENROUTER_AI_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: "google/learnlm-1.5-pro-experimental:free",
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: prompt
							}
						]
					}
				]
			})
		})

        const jsonResult = await res.json()

        if (jsonResult.error) {
            logger.error("Error generating the analysis", jsonResult.error)
            return null
        }

        const text = jsonResult.choices[0].message.content

		logger.success(`Analysis generated successfully for ${symbol}`)

		const json = text
            .replace(/```json/g, "")
            .replace(/```/g, "")

		const typedJson = JSON.parse(json) as Analysis

		// logger.info(`Recommendation for ${symbol}: ${typedJson.recommendation} because ${typedJson.reasonFrBeginner} (confidence: ${typedJson.confidence})`)

		return {
			text: text,
			json: typedJson
		}
	} catch (err) {
		logger.error("Error generating the analysis", err)

		return null
	}
}

// TODO: Optimize
async function getInfo({ symbol, language }: { symbol: string; language?: string }) {
	const { result } = await fetchSymbol({
		language: language,
		symbol: symbol,
		fields: "all"
	})

	if (!result) {
		return null
	}

	return result as any
}
