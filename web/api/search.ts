import { Hono } from "hono"

const searchHono = new Hono()

// Remove cross-origin restrictions
searchHono.use((req, next) => {
    // req.res.setHeader("Access-Control-Allow-Origin", "*")
    // req.res.setHeader("Access-Control-Allow-Methods", "*")
    // req.res.setHeader("Access-Control-Allow-Headers", "*")

    req.res.headers.set("Access-Control-Allow-Origin", "*")
    req.res.headers.set("Access-Control-Allow-Methods", "*")
    req.res.headers.set("Access-Control-Allow-Headers", "*")

    return next()
})

searchHono.get("/symbol", async (req) => {
    // Get params from the request
    const { search } = req.req.query()

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

    console.log(symbols)

    return req.json(symbols)
})

export default searchHono