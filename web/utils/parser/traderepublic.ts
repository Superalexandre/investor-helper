import { fileURLToPath } from "node:url"
import path from "node:path"
import logger from "../../../log"
import fs from "node:fs"
import PDFParser from "pdf2json"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { walletSymbolsSchema } from "../../../db/schema/users"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// node --loader ts-node/esm ./web/utils/parser/traderepublic.ts

interface Stock {
	name: string
	quantity: number
	isin: string
	// country: string
	buyPrice: number
	date: string
	total: number
}

async function parser({
	buffer
}: {
	buffer: Buffer
}): Promise<Stock[] | undefined> {
	return new Promise<Stock[] | undefined>((resolve, reject) => {
		const pdfParser = new PDFParser()

		pdfParser.parseBuffer(buffer)

		pdfParser.on("pdfParser_dataError", (errData) => {
			logger.error(errData.parserError)

			reject(errData.parserError)
		})

		pdfParser.on("pdfParser_dataReady", (pdfData) => {
			if (!pdfData) {
				logger.error("No data found")

				return undefined
			}

			const pages = pdfData.Pages

			if (!pages) {
				logger.error("No pages found")
				return undefined
			}

			const allTexts: { y: number; x: number; text: string }[] = []
			for (const page of pages) {
				const texts = page.Texts

				for (const text of texts) {
					const y = text.y
					const x = text.x

					const textContent = text.R.map((r) => decodeURIComponent(r.T)).join("")

					allTexts.push({ x, y, text: textContent })
				}
			}

			const tolerance = 0.8
			const groupedTexts: { y: number; x: number; text: string }[][] = []

			for (const text of allTexts) {
				const found = groupedTexts.find((group) => {
					const lastText = group.at(-1)
					const avgGroupY = group.reduce((acc, curr) => acc + curr.y, 0) / group.length

					if (!lastText) {
						return false
					}

					return Math.abs(avgGroupY - text.y) <= tolerance || Math.abs(lastText.y - text.y) <= tolerance
				})

                // TODO: Find a better way to filter those
                if (text.text === "Relevé de transaction en Allemagne") {
                    continue
                }

                if (text.text.startsWith("Pays d'enregistrement:")) {
                    continue
                }

				if (found) {
					found.push(text)
				} else {
					groupedTexts.push([text])
				}
			}

			const validGroup = groupedTexts.filter((group) => {
				const groupText = group
					.sort((a, b) => a.x - b.x)
					.map((text) => text.text)
					.join(" ")

				return groupText.includes("ISIN")
			})

            // console.log(validGroup)

			const stocks = validGroup.map((group) => {
				const [rawQuantity, name, , rawIsin, price, date] = group.map((text) => text.text)

				const [quantity] = rawQuantity.split(" ")
				const quantityNumber = Number.parseFloat(quantity.replace(",", "."))

				const [, isin] = rawIsin.split(": ")
				// const [, country] = rawCountry.split(": ")

				const buyPrice = Number.parseFloat(price.replace(",", "."))
				const total = quantityNumber * buyPrice

				return {
					name: name,
					quantity: quantityNumber,
					isin,
					// country,
					buyPrice,
					date,
					total
				} satisfies Stock
			})

			fs.writeFileSync(`${__dirname}/stocks.json`, JSON.stringify(stocks, null, 4))

			resolve(stocks)
		})
	})
}

const sqlite = new Database("./db/sqlite.db")
const db = drizzle(sqlite)

async function searchSymbol(search: string, searching = "undefined") {
	const url = new URL(
		// biome-ignore lint/nursery/noSecrets: URL
		"https://symbol-search.tradingview.com/symbol_search/v3/"
	)

	url.searchParams.set("text", search)
	url.searchParams.set("hl", "1")
	url.searchParams.set("lang", "fr")
	url.searchParams.set("search_type", searching)
	url.searchParams.set("domain", "production")
	url.searchParams.set("sort_by_country", "FR")

	const res = await fetch(url, {
		headers: {
			accept: "application/json",
			"accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
			"content-type": "application/json",

			origin: "https://www.tradingview.com",
			referer: "https://www.tradingview.com/"
		}
	})

	const symbols = await res.json()

	return symbols
}

async function parse(): Promise<void> {
	const buffer = fs.readFileSync(`${__dirname}/Titres.pdf`)

	const stocks = await parser({ buffer })

	if (!stocks) {
		logger.error("No stocks found")
		return
	}

	for (const stock of stocks) {
		const result = await searchSymbol(stock.isin)

		if (!result || !result.symbols || result.symbols.length === 0) {
			logger.error(`No result found ${stock.isin} (${stock.name})`)

			continue
		}

		const stockData = result.symbols[0]

		if (!stockData) {
			logger.error(`No data found ${stock.isin} (${stock.name})`)

			continue
		}

        // Stock date is in the format dd/mm/yyyy
        const [day, month, year] = stock.date.split("/")
        const stockDate = new Date(`${year}-${month}-${day}`)

        const realDate: Record<string, Date> = {
            // Renault
            "FR0000131906": new Date("2025-06-04"),
            // BIC 50
            "IE00B1W57M07": new Date("2024-10-07"),
            // 3x Lev SP500
            "IE00B7Y34M31": new Date("2024-11-11"),
            // MSCI Semiconductor
            "LU1900066033": new Date("2024-10-07"),
            // Apple
            "US0378331005": new Date("2025-01-03"),
            // Microsoft
            "US5949181045": new Date("2021-06-30"),
            // NVIDIA
            "US67066G1040": new Date("2021-06-13"),
            // Palantir
            "US69608A1088": new Date("2024-12-09"),
        }

		await db.insert(walletSymbolsSchema).values({
			walletId: "6f7337b9-286e-438e-ad28-705abb1df1ce",
			symbol: `${stockData.exchange}:${stockData.symbol}`,
			quantity: stock.quantity,
			currency: stockData.currency_code,
			buyAt: realDate[stock.isin].toISOString(),
			buyPrice: stock.buyPrice
		})

		logger.info(`Added ${stockData.exchange}:${stockData.symbol} (${stock.name}) to wallet`)
	}
}

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection at:", promise, "reason:", reason)
})

parse().catch((err) => {
	logger.error(`Error: ${err.toString()}`)
})
