import fs from "fs"

const columns = [
    "name",
    "description",
    "logoid",
    "update_mode",
    "type",
    "typespecs",
    "close",
    "pricescale",
    "minmov",
    "fractional",
    "minmove2",
    "currency",
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
    "belgium",
    // "brazil",
    "canada",
    // "chile",
    "china",
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
    "qatar",
    // "romania",
    // "russia",
    // "ksa",
    // "serbia",
    // "singapore",
    // "slovakia",
    // "rsa",
    "korea",
    "spain",
    // "srilanka",
    // "sweden",
    "switzerland",
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
        10_000
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
        20_000
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
        "base_currency",
        "base_currency_desc",
        "base_currency_logoid",
        "update_mode",
        "type",
        "typespecs",
        "exchange",
        "crypto_total_rank",
        "close",
        "pricescale",
        "minmov",
        "fractional",
        "minmove2",
        "currency",
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

async function getPrices() {
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

    for (const stock of data) {
        const symbol = stock.s

        console.log(`${symbol} : ${stock.d[6]} ${stock.d[11]}`)
    }

    fs.writeFileSync("prices.json", JSON.stringify(data, null, 4))

    console.log(data.length)



    return data
}
/*
async function getPrices() {
    const urls = [
        "https://scanner.tradingview.com/america/scan",
        "https://scanner.tradingview.com/france/scan",
        "https://scanner.tradingview.com/germany/scan",
        "https://scanner.tradingview.com/uk/scan"
    ]

    const jsons = []

    for (const url of urls) {
        const res = await fetch(url, {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
                "Content-Type": "application/json"
            }
        })

        const json = await res.json()

        jsons.push(...json.data)
    }

    // console.log(jsons)

    for (const data of jsons) {
        const symbol = data.s

        console.log(`${symbol} : ${data.d[6]} ${data.d[11]}`)
        // console.log(data.d)
    }

    console.log(jsons.length)

    fs.writeFileSync("prices.json", JSON.stringify(jsons, null, 4))

    return jsons
}
*/

getPrices()

export default getPrices