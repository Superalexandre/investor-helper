import TradingView from "@mathieuc/tradingview"

// import fs from "fs"
interface Period {
    time: number
    open: number
    close: number
    max: number
    min: number
    volume: number
}

export default function getPrices(symbolId: string, {
    range = 100,
    timeframe = "D"
}: {
    range?: number
    timeframe?: string
} = {}) {
    // Create promise to resolve when the chart is loaded
    return new Promise<Period[]>((resolve, reject) => {
        const client = new TradingView.Client() // Creates a websocket client

        const chart = new client.Session.Chart() // Init a Chart session

        chart.setMarket(symbolId, { // Set the market
            timeframe,
            range
        })

        chart.onError((...err: unknown[]) => {
            console.error("Chart error:", ...err)
            reject(err)
        })

        chart.onSymbolLoaded(() => { // When the symbol is successfully loaded
        })

        chart.onUpdate(() => { // When price changes
            if (!chart.periods[0]) return

            resolve(chart.periods)
        })
    })
}

// eslint-disable-next-line no-secrets/no-secrets
/*
// import fs from "fs"
import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { symbolPrices as symbolPricesSchema, symbols as symbolsSchema } from "../../db/schema/symbols"

const columns = [
    "name",
    "description",
    "logoid",
    "type",
    "close",
    "currency",
    "update_mode",
    "typespecs",
    "pricescale",
    "minmov",
    "fractional",
    "minmove2",
    "change",
    "volume",
    "relative_volume_10d_calc",
    "market_cap_basic",
    "fundamental_currency_code",
    "price_earnings_ttm",
    "earnings_per_share_diluted_ttm",
    "earnings_per_share_diluted_yoy_growth_ttm",
    "dividends_yield_current",
    "sector.tr",
    "market",
    "sector",
    "recommendation_mark",
    "exchange"
]

const markets = [
    "america",
    // "argentina",
    // "australia",
    // "austria",
    // "bahrain",
    // "bangladesh",
    // "belgium",
    // "brazil",
    // "canada",
    // "chile",
    // "china",
    // "colombia",
    // "cyprus",
    // "czech",
    // "denmark",
    // "egypt",
    // "estonia",
    // "finland",
    "france",
    "germany",
    // "greece",
    "hongkong",
    // "hungary",
    // "iceland",
    // "india",
    // "indonesia",
    // "israel",
    "italy",
    "japan",
    // "kenya",
    // "kuwait",
    // "latvia",
    // "lithuania",
    "luxembourg",
    // "malaysia",
    // "mexico",
    // "morocco",
    "netherlands",
    // "newzealand",
    // "nigeria",
    // "norway",
    // "pakistan",
    // "peru",
    // "philippines",
    // "poland",
    // "portugal",
    // "qatar",
    // "romania",
    // "russia",
    // "ksa",
    // "serbia",
    // "singapore",
    // "slovakia",
    // "rsa",
    "korea",
    // "spain",
    // "srilanka",
    // "sweden",
    // "switzerland",
    // "taiwan",
    // "thailand",
    // "tunisia",
    // "turkey",
    // "uae",
    "uk",
    // "venezuela",
    // "vietnam"
]

const paramsStocks = {
    "columns": columns,
    "ignore_unknown_fields": false,
    "options": {
        "lang": "en"
    },
    "range": [
        0,
        200
    ],
    "sort": {
        "sortBy": "market_cap_basic",
        "sortOrder": "desc"
    },
    "symbols": {

    },
    "markets": markets,
    "filter": [
        {
            "left": "is_primary",
            "operation": "equal",
            "right": true
        }
    ],
    "filter2": {
        "operator": "and",
        "operands": [
            {
                "operation": {
                    "operator": "or",
                    "operands": [
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "type",
                                            "operation": "equal",
                                            "right": "stock"
                                        }
                                    },
                                    {
                                        "expression": {
                                            "left": "typespecs",
                                            "operation": "has",
                                            "right": [
                                                "common"
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "type",
                                            "operation": "equal",
                                            "right": "stock"
                                        }
                                    },
                                    {
                                        "expression": {
                                            "left": "typespecs",
                                            "operation": "has",
                                            "right": [
                                                "preferred"
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "type",
                                            "operation": "equal",
                                            "right": "dr"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "type",
                                            "operation": "equal",
                                            "right": "fund"
                                        }
                                    },
                                    {
                                        "expression": {
                                            "left": "typespecs",
                                            "operation": "has_none_of",
                                            "right": [
                                                "etf"
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
}

const paramsETFs = {
    "columns": columns,
    "ignore_unknown_fields": false,
    "options": {
        "lang": "en"
    },
    "price_conversion": {
        "to_currency": "usd"
    },
    "range": [
        0,
        200
    ],
    "sort": {
        "sortBy": "aum",
        "sortOrder": "desc"
    },
    "symbols": {

    },
    "markets": markets,
    "filter": [
        {
            "left": "is_primary",
            "operation": "equal",
            "right": true
        }
    ],
    "filter2": {
        "operator": "and",
        "operands": [
            {
                "operation": {
                    "operator": "or",
                    "operands": [
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "typespecs",
                                            "operation": "has",
                                            "right": [
                                                "etn"
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "typespecs",
                                            "operation": "has",
                                            "right": [
                                                "etf"
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "operation": {
                                "operator": "and",
                                "operands": [
                                    {
                                        "expression": {
                                            "left": "type",
                                            "operation": "equal",
                                            "right": "structured"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
}

const paramsCrypto = {
    "columns": [
        "name",
        "description",
        "logoid",
        "type",
        "close",
        "currency",
        "base_currency",
        "base_currency_desc",
        "base_currency_logoid",
        "update_mode",
        "type",
        "typespecs",
        "exchange",
        "crypto_total_rank",
        "pricescale",
        "minmov",
        "fractional",
        "minmove2",
        "24h_close_change|5",
        "market_cap_calc",
        "fundamental_currency_code",
        "24h_vol_cmc",
        "circulating_supply",
        "crypto_common_categories.tr"
    ],
    "ignore_unknown_fields": false,
    "options": {
        "lang": "en"
    },
    "range": [
        0,
        1000
    ],
    "sort": {
        "sortBy": "crypto_total_rank",
        "sortOrder": "asc"
    },
    "symbols": {},
    "markets": [
        "coin"
    ]
}

const forceList = [
    {
        symbolId: "EURONEXT:CHIP" 
    }
]

async function getPrices() {
    const sqlite = new Database("../db/sqlite.db")
    const db = drizzle(sqlite)

    const resStocks = await fetch("https://scanner.tradingview.com/global/scan", {

        method: "POST",
        body: JSON.stringify(paramsStocks),
        headers: {
            "Content-Type": "application/json"
        }
    })

    const resETFs = await fetch("https://scanner.tradingview.com/global/scan", {
        method: "POST",
        body: JSON.stringify(paramsETFs),
        headers: {
            "Content-Type": "application/json"
        }
    })

    const resCrypto = await fetch("https://scanner.tradingview.com/coin/scan", {
        method: "POST",
        body: JSON.stringify(paramsCrypto),
        headers: {
            "Content-Type": "application/json"
        }
    })

    const jsonStocks = await resStocks.json()
    const jsonETFs = await resETFs.json()
    const jsonCrypto = await resCrypto.json()

    const data = [...jsonStocks.data, ...jsonETFs.data, ...jsonCrypto.data]

    const dbSymbols = await db
        .select({
            symbolId: symbolsSchema.symbolId
        })
        .from(symbolsSchema)
    
    for (const force of [...forceList, ...dbSymbols]) {
        const fields = [
            "name",
            "description",
            "close",
            "currency",
            "type",
            "logoid"
        ]

        const res = await fetch(`https://scanner.tradingview.com/symbol?symbol=${force.symbolId}&fields=${fields.join(",")}&no_404=true&label-product=right-details`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })


        const json = await res.json()

        if (!json) {
            console.log("Error fetching data for ", force.symbolId)
            continue
        }

        console.log(json)

        data.push({
            d: [json.name, json.description, json.logoid, json.type, json.close, json.currency]
        })
    }

    const symbolCached: string[] = []
    const insertData = []
    for (const stock of data) {
        const symbol = stock.s

        if (symbolCached.includes(symbol)) continue

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [name, description, logoid, type, close, currency] = stock.d

        insertData.push({
            symbolId: symbol,
            date: new Date().toISOString(),
            price: close,
            currency
        })

        symbolCached.push(symbol)
    }

    // fs.writeFileSync("prices.json", JSON.stringify(data, null, 4))

    console.log("Added data prices ", data.length)


    // Do chunk insert
    const chunkSize = 5_000
    for (let i = 0; i < insertData.length; i += chunkSize) {
        const chunk = insertData.slice(i, i + chunkSize)
        await db
            .insert(symbolPricesSchema)
            .values(chunk)
    }

    return data
}

// getPrices()

export default getPrices
*/