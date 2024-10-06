import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState } from "react"
import { useDebounceValue } from "usehooks-ts"
import { cn } from "@/lib/utils"
import { normalizeSymbolHtml } from "@/utils/normalizeSymbol"
import { News } from "@/schema/news"
import { Link, useLocation, useNavigate } from "@remix-run/react"
import { MdClose } from "react-icons/md"
import { MetaFunction } from "@remix-run/node"

interface SelectSymbolType {
    symbol: string
    description: string
    exchange: string
    logoid: string
    price: number
    quantity: number
    currency_code: string
    prefix?: string
}

type SearchType = "all" | "allSymbol" | "stocks" | "crypto" | "news"

export const meta: MetaFunction = () => {
    const title = "Investor Helper - Rechercher"
    const description = "Recherchez un symbole, une action, une crypto, une news sur Investor Helper. Trouvez rapidement les informations dont vous avez besoin pour vos investissements et vos analyses financières."

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://investor-helper.com/search" },
    ]
}

export default function Index() {
    const location = useLocation()
    const navigate = useNavigate()

    const inputRef = useRef<HTMLInputElement>(null)

    const [resultSymbols, setResultSymbols] = useState<SelectSymbolType[]>([])
    const [resultNews, setResultNews] = useState<News[]>([])

    const search = new URLSearchParams(location.search).get("search")
    const [debouncedValue, setValue] = useDebounceValue(search ?? "", 750)
    const [hidden, setHidden] = useState(true)
    const [searchingIn, setSearchingIn] = useState<SearchType>("all")

    const [, setLoading] = useState(false)

    const pathname = location.pathname

    const reset = () => {
        // inputRef.current?.value = ""
        if (inputRef.current) inputRef.current.value = ""

        setValue("")
        setResultSymbols([])
        setResultNews([])
        setHidden(true)
    
        navigate(pathname)
    }

    useEffect(() => {
        if (!debouncedValue) {
            reset()

            return
        }

        setLoading(true)


        fetch(`/api/search?search=${debouncedValue}&searching=${searchingIn}`)
            .then(response => response.json())
            .then(data => {
                setResultSymbols(data.symbols as SelectSymbolType[])
                setResultNews(data.news as News[])

                setLoading(false)
                setHidden(false)
            })

        navigate(pathname + "?search=" + debouncedValue)

    }, [debouncedValue, searchingIn])

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-full">
                <div>
                    <Input
                        className="w-full"
                        name="symbol"
                        type="text"
                        placeholder="Rechercher un symbole, une action, une crypto, une news..."
                        
                        onChange={event => setValue(event.target.value)}
                        defaultValue={search ?? ""}

                        ref={inputRef}
                        required={true}
                    />

                    {!hidden ? (
                        <Button
                            variant="ghost"
                            onClick={reset}
                            className="absolute right-0 top-0"
                        >
                            <MdClose className="size-6" />
                        </Button>
                    ) : null}
                </div>

                {!hidden ? (
                    <div className="absolute left-0 top-full z-10 mt-1 flex w-full flex-col gap-1 overflow-x-hidden">
                        <div className="flex flex-row items-center gap-1 overflow-x-auto">
                            <Button
                                variant={searchingIn === "all" ? "default" : "outline"}
                                onClick={() => setSearchingIn("all")}
                            >
                                Tout
                            </Button>

                            <Button
                                variant={searchingIn === "news" ? "default" : "outline"}
                                onClick={() => setSearchingIn("news")}
                            >
                                News
                            </Button>

                            <Button
                                variant={searchingIn === "allSymbol" ? "default" : "outline"}
                                onClick={() => setSearchingIn("allSymbol")}
                            >
                                Tous les symboles
                            </Button>

                            <Button
                                variant={searchingIn === "stocks" ? "default" : "outline"}
                                onClick={() => setSearchingIn("stocks")}
                            >
                                Actions
                            </Button>

                            <Button
                                variant={searchingIn === "crypto" ? "default" : "outline"}
                                onClick={() => setSearchingIn("crypto")}
                            >
                                Crypto
                            </Button>
                        </div>

                        <div className={cn(hidden ? "hidden" : "block")}>
                            {resultNews.length > 0 ? resultNews.map((news) => (
                                <Link to={`/news/${news.id}`} key={news.id}>
                                    <Button
                                        variant="outline"
                                        key={news.id}
                                        className="flex w-full flex-row items-center justify-between border-none p-2"
                                    >
                                        <p>{news.title}</p>
                                    </Button>
                                </Link>
                            )) : null}

                            {resultSymbols.length > 0 ? resultSymbols.map((symbol, i) => (
                                <Link to={`/data/${normalizeSymbolHtml(symbol.symbol)}`} key={normalizeSymbolHtml(symbol.symbol) + "-" + i}>
                                    <Button
                                        variant="outline"
                                        key={normalizeSymbolHtml(symbol.symbol) + "-" + i}
                                        className="flex w-full flex-row items-center justify-between border-none p-2"
                                    >
                                        <p>{normalizeSymbolHtml(symbol.description)} ({normalizeSymbolHtml(symbol.symbol)})</p>

                                        <p>{symbol.exchange}</p>
                                    </Button>
                                </Link>
                            )) : null}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export type { SelectSymbolType }