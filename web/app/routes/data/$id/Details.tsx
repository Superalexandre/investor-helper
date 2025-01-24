import { useQuery } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import SymbolLogo from "../../../components/symbolLogo"
import { Link } from "@remix-run/react"

export function Details({ symbol }: { symbol: string }): ReactNode {
	const [open, setOpen] = useState(false)
	const {
		data,
		isPending,
		error
	} = useQuery<{
		data: {
			top_holdings: Array<{ name: string, symbol: string, weight: number }>
		}
	}>({
		queryKey: [
			"dataDetails",
			{
				symbol: symbol,
			}
		],
		queryFn: async () => {
			const req = await fetch(
				`/api/data/fund/details?symbol=${symbol}`
			)
			const json = await req.json()

			return json
		},
		refetchOnWindowFocus: true
	})

	console.log(data)

	if (isPending) {
		return <p>Loading...</p>
	}

	if (!data) {
		return <p>No prices</p>
	}

	const colors = [
		"#0088FE",
		"#00C49F",
		"#FFBB28",
		"#FF8042",
		"#8884D8",
		"#82CA9D",
		"#A4DE6C",
		"#D0ED57",
		"#FFC658",
		"#FFD700",
	]

	// Only display the top 10 holdings in the pie chart
	// and the list of holdings
	const formattedHolding = data.data.top_holdings.slice(0, 10)

	return (
		<>
			<Dialog open={open} onOpenChange={(newOpen): void => setOpen(newOpen)}>
				<DialogContent className="h-11/12 max-h-[91%] max-w-fit overflow-auto">
					<DialogHeader>
						<DialogTitle className="w-11/12 truncate">Composition</DialogTitle>
						<DialogDescription>
							Composition of the fund
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2">
						{data.data.top_holdings.map((holding) => {
							return (
								<Button variant="link" asChild={true} key={holding.symbol} className="p-0">
									<Link
										to={holding.symbol ? `/data/${holding.symbol}` : "#"}
										className="flex flex-row items-center justify-between"
									>
										<p className="w-8/12 truncate">{holding.name}</p>

										<p>{holding.weight.toFixed(2)}%</p>
									</Link>
								</Button>
							)
						})}
					</div>
				</DialogContent>
			</Dialog>

			<div className="h-[300px] w-full md:w-1/2">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={formattedHolding}
							dataKey="weight"
							nameKey="name"
							cx="50%"
							cy="50%"
							labelLine={false}
							outerRadius={80}
							fill="#8884d8"
							width="100%"
							height="100%"
						>
							{formattedHolding.map((entry, index) => (
								<Cell key={`cell-${entry.symbol}`} fill={colors[index % colors.length]} />
							))}
						</Pie>

						<Tooltip
							content={({ payload }): ReactNode => {
								if (payload && payload.length > 0) {
									const { name, weight } = payload[0].payload
									return (
										<div className="rounded bg-background p-2 shadow">
											<p className="font-bold">{name}</p>
											<p>{weight.toFixed(2)}%</p>
										</div>
									)
								}

								return null
							}}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>
			<div className="mt-4 w-full md:mt-0 md:w-1/2">
				<ul className="flex flex-col gap-2">
					{formattedHolding.map((item, index) => (
						<Button variant="link" key={item.name} className="flex items-center p-0" asChild={true}>
							<Link to={item.symbol ? `/data/${item.symbol}` : "#"} className="flex items-center">
								<div
									className="mr-2 h-4 w-4 rounded-full"
									style={{ backgroundColor: colors[index % colors.length] }}
								/>
								<span className="flex-grow">{item.name}</span>
								<span className="font-bold">{item.weight?.toFixed(2)}%</span>
							
							</Link>
						</Button>
					))}
				</ul>

				{data.data.top_holdings.length > 10 ? (
					<div className="mt-4 flex flex-row items-center justify-between">
						<p>And {data.data.top_holdings.length - 10} more...</p>
						<Button
							onClick={(): void => setOpen(true)}
						>
							Show more
						</Button>
					</div>
				) : null}
			</div>
		</>
	)
}
