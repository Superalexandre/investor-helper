import { json, LoaderFunction, LoaderFunctionArgs } from "@remix-run/node"

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const search = url.searchParams.get("search")

    if (!search) {
        return json({ error: "Missing search parameter" }, {
            status: 400
        })
    }

    // eslint-disable-next-line no-secrets/no-secrets
    const res = await fetch(`https://symbol-search.tradingview.com/symbol_search/v3/?text=${search}&hl=1&lang=fr&search_type=undefined&domain=production&sort_by_country=FR`, {
        headers: {
            "accept": "application/json",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",

            "origin": "https://www.tradingview.com",
            "referer": "https://www.tradingview.com/",
        }
    })

    const symbols = await res.json()

    return json(symbols)
}