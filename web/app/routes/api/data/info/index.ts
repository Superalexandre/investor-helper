import type { LoaderFunction } from "@remix-run/node"
import { fetchSymbol } from "../../../../../utils/tradingview/request"

export const loader: LoaderFunction = () => {
    return {

    }

}

async function getInfo({ symbol }: { symbol: string }) {
    const { parsedResult } = await fetchSymbol({
        symbol: symbol,
        fields: "all"
    })

    if (!parsedResult) {
        return []
    }

    return parsedResult
}

export {
    getInfo
}