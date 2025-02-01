import { memo, useState } from "react"
import type { NewsRelatedSymbol } from "../../../db/schema/news"
import { normalizeSymbol } from "../../utils/normalizeSymbol"
import { Link } from "@remix-run/react"
import { Badge } from "./ui/badge"
import SymbolLogo from "./symbolLogo"
import type { Symbol as SymbolType } from "@/schema/symbols"
import type { TFunction } from "i18next"

interface FullSymbol {
	symbol: SymbolType
	// biome-ignore lint/style/useNamingConvention: <explanation>
	news_related_symbol: NewsRelatedSymbol
}

export default memo(function DisplaySymbols({
	symbolList,
	redirect,
	hash,
	t
}: {
	symbolList: FullSymbol[]
	redirect?: string
	hash?: string
	t: TFunction
}) {
	const [viewAll, setViewAll] = useState(false)

	if (!symbolList || symbolList.length <= 0) {
		return null
	}

	const symbolCount = symbolList.length

	const displaySymbols = viewAll ? symbolList : symbolList.slice(0, 5)

	return (
		<div className="flex flex-row flex-wrap items-center gap-1.5">
			{displaySymbols.map((symbol) => (
				<Link
					to={{
						pathname: `/data/${normalizeSymbol(symbol.symbol.symbolId)}`
					}}
					state={{
						redirect: redirect ?? "/news",
						hash: hash
					}}
					key={symbol.symbol.symbolId}
				>
					<Badge
						key={symbol.symbol.symbolId}
						variant="default"
						className="flex h-8 flex-row items-center justify-center"
					>
						<SymbolLogo 
							symbol={symbol.symbol} 
							className="mr-1.5 size-6 rounded-full" 
							width={24}
							height={24}
							format="webp"
						/>

						{symbol.symbol.name}
					</Badge>
				</Link>
			))}

			{symbolList.length > 5 && !viewAll ? (
				<Badge
					variant="default"
					className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
					onClick={() => setViewAll(true)}
				>
					{t("seeAll")} ({symbolCount})
				</Badge>
			) : null}
			{symbolList.length > 5 && viewAll ? (
				<Badge
					variant="default"
					className="flex h-8 flex-row items-center justify-center hover:cursor-pointer"
					onClick={() => setViewAll(false)}
				>
					{t("seeLess")}
				</Badge>
			) : null}
		</div>
	)
})
