import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export function Details({ symbol }: { symbol: string }): ReactNode {
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

	const RADIAN = Math.PI / 180;
	const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: {
		cx: number
		cy: number
		midAngle: number
		innerRadius: number
		outerRadius: number
		percent: number
		index: number
	}): ReactNode => {
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<g  x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
				<image 
					href={`/api/image/symbol?name=${data.data.top_holdings[index].symbol}`}
					x={x - 10}
					y={y - 10}
					width={20}
					height={20}
				/>

				<text
					x={x}
					y={y}
					dy={8}
					fontSize={12}
					fill="white"
					textAnchor="middle"
				>
					{`${(percent * 100).toFixed(0)}%`}
				</text>
			</g>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={400}>
			<PieChart>
				<Pie
					data={data.data.top_holdings}
					dataKey="weight"
					nameKey="name"
					labelLine={false}
					label={renderCustomizedLabel}
					// cx={500}
					// cy={200}
					// innerRadius={40}
					// outerRadius={80}
					fill="#8884d8"
				>
					{data.data.top_holdings.map((entry, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<Cell key={`cell-${index}`} fill={"#8884d8"} />
					))}
				</Pie>

				<Tooltip />
			</PieChart>
		</ResponsiveContainer>
	)
}
