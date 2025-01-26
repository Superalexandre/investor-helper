import type { LoaderFunction } from "react-router";
import {parse} from "node-html-parser"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const symbol = url.searchParams.get("symbol")

	const response = await fetch(`https://tradingview.com/symbols/${symbol}/analysis/`)
	const dataHtml = await response.text()

	const root = parse(dataHtml)

    const content = root.querySelector(".tv-category-content > script[type='application/prs.init-data+json']")

	if (!content) {
		return {
			error: true,
			success: false,
			message: "Symbol not found"
		}
	}

	const text = content.textContent
	const jsonContent = JSON.parse(text)
	const dynamicKey = Object.keys(jsonContent)[0]

	const json = jsonContent[dynamicKey]

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
		data: json.data.symbol || {}
	}
}
