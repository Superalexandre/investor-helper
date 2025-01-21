import type { LoaderFunction } from "@remix-run/node"
import { fetchSymbol } from "../../../../../utils/tradingview/request"
import { reverseNormalizeSymbol } from "../../../../../utils/normalizeSymbol"
import { parse } from "node-html-parser"
import getLanguage from "../../../../lib/getLanguage"
import currencies from "../../../../../../lang/currencies"

export const loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url)
	const symbol = url.searchParams.get("symbol")

	if (!symbol) {
		return {
			error: true,
			success: false,
			message: "Symbol not found"
		}
	}

	const language = await getLanguage(request)
	const data = await getInfo({ symbol: symbol, language: language })

    if (!data) {
        return {
            error: true,
            success: false,
            message: "Symbol not found"
        }
    }

    const dataCurrency = data.currency as string
	const prettyCurrency = currencies[dataCurrency]?.symbol_native ?? dataCurrency

	return {
		error: false,
		success: true,
		message: "Data fetched successfully",
		info: {
            ...data,
            prettyCurrency
        }
	}
}

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

export { getInfo }
