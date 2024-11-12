import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Form, useActionData, useLoaderData, useNavigate, useSearchParams, useSubmit } from "@remix-run/react"
import { ClientOnly } from "remix-utils/client-only"
import { Stage, Layer, Rect, Text, Image, Group } from "react-konva"
import { type RefObject, useRef, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

interface SymbolData {
    name: string
    symbol: string
    color: {
        background: string
    }
    price: number
    currency: string
    exchange: string
    change: number
    logo: string
}

interface ItemData extends SymbolData {
    columnIndex: number
    rowIndex: number
}

type ColumnData = ItemData[]

interface AllItemsData extends ItemData {
    x: number
    y: number
    rectHeight: number
    rectWidth: number
}

interface Markets {
    [key: string]: {
        url: string
        symbolset: string[]
        markets: string[]
    }
}

const colors = {
    "darkGreen": {
        background: "#16a34a", // text-green-600
    },
    "green": {
        background: "#22c55e", // text-green-500
    },
    "lightGreen": {
        background: "#4ade80", // text-green-400
    },
    "gray": {
        background: "#9ca3af", //text-gray-500
    },

    "darkRed": {
        background: "#dc2626", // red-600
    },
    "red": {
        background: "#ef4444", // red-500
    },
    "lightRed": {
        background: "#f87171" // red-400
    }
}

const textConfig = {
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: "#333",
}

async function getData(market = "SP500") {

    const markets: Markets = {
        "SP500": {
            "url": "https://scanner.tradingview.com/america/scan?label-product=heatmap-stock",
            "symbolset": [
                "SYML:SP;SPX"
            ],
            "markets": [
                "america"
            ]
        },
        "CAC40": {
            "url": "https://scanner.tradingview.com/france/scan?label-product=heatmap-stock",
            "symbolset": [
                "SYML:EURONEXT;PX1"
            ],
            "markets": [
                "france"
            ]
        }
    }

    const body = {
        "columns": [
            "close",
            "currency",
            "exchange",
            "change",
            "logoid",

            "description"
        ],
        // biome-ignore lint/style/useNamingConvention: <explanation>
        "ignore_unknown_fields": false,
        "options": {
            "lang": "fr"
        },
        "range": [
            0,
            100
        ],
        "sort": {
            "sortBy": "market_cap_basic",
            "sortOrder": "desc"
        },
        "symbols": {
            "symbolset": markets[market].symbolset
        },
        "markets": markets[market].markets,
        "filter": [
            {
                "left": "market_cap_basic",
                "operation": "nempty"
            },
            {
                "left": "is_blacklisted",
                "operation": "equal",
                "right": false
            },
            {
                "left": "name",
                "operation": "not_in_range",
                "right": [
                    "GOOG"
                ]
            }
        ]
    }

    const res = await fetch(markets[market].url, {
        method: "POST",
        body: JSON.stringify(body)
    })

    const json = await res.json()
    const data: SymbolData[] = []

    for (const item of json.data) {
        const change = item.d[3]

        let color = colors.gray
        if (change >= 3) {
            color = colors.darkGreen
        } else if (change >= 1.5) {
            color = colors.green
        } else if (change >= 0.5) {
            color = colors.lightGreen
        } else if (change <= -3) {
            color = colors.darkRed
        } else if (change <= -1.5) {
            color = colors.red
        } else if (change < -0.5) {
            color = colors.lightRed
        }

        data.push({
            name: item.d[5],
            symbol: item.s,
            color: color,
            price: item.d[0],
            currency: item.d[1],
            exchange: item.d[2],
            change: item.d[3] ? item.d[3].toFixed(2) : 0,
            logo: item.d[4]
        })
    }


    return data
}

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url)

    const data = await getData(url.searchParams.get("market") ?? undefined)

    return {
        data
    }
}

export async function action({ request }: ActionFunctionArgs) {
    let market = "SP500"
    const body = await request.formData()
    if (body.get("market")) {
        market = body.get("market") as string
    }

    const data = await getData(market)

    return {
        data
    }
}

export const meta: MetaFunction = () => {
    const title = "Investor Helper - Heatmap"
    const description = ""

    return [
        { title: title },
        { name: "og:title", content: title },
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "canonical", content: "https://www.investor-helper.com/heatmap" }
    ]
}

export default function Index() {
    const { data } = useLoaderData<typeof loader>()
    const lastData = useActionData<typeof action>()
    
    const submit = useSubmit()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const containerRef = useRef<HTMLDivElement>(null)

    const handleSubmit = (value: string) => {
        const formData = new FormData()

        formData.append("market", value)

        submit(formData, { method: "post" })

        navigate(`/heatmap?market=${value}`)
    }

    // Get the search market from the URL
    const market = searchParams.get("market") || "SP500"

    return (
        <div className="h-full flex-1" ref={containerRef}>
            <ClientOnly fallback={<p>Chargement</p>}>
                {() => (
                    <Form className="relative" method="POST">
                        <div className="absolute top-0 left-0 z-10 m-4">

                            <Select name="market" defaultValue={market} onValueChange={(value) => handleSubmit(value)}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Choisir un marché" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SP500">S&P 500</SelectItem>
                                    <SelectItem value="CAC40">CAC 40</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Heatmap data={lastData ? lastData.data : data} containerRef={containerRef} />

                        <div className="absolute bottom-0 left-0 m-4 flex flex-row items-center gap-4">
                            <img src="/logo-1024-1024.webp" alt="Investor Helper" className="h-16 w-16" />

                            <p className="font-bold text-lg">Investor Helper</p>
                        </div>
                    </Form>
                )}
            </ClientOnly>
        </div>
    );
}

const wheelHandler = (e: KonvaEventObject<WheelEvent>, height: number, width: number) => {
    const scaleBy = 1.1
    const stage = e.target.getStage()

    if (!stage) {
        return
    }

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()

    if (!pointer) {
        return
    }

    const mousePointTo = {
        x: pointer.x / oldScale - stage.x() / oldScale,
        y: pointer.y / oldScale - stage.y() / oldScale
    }

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

    if (newScale > 3 || newScale < 0.5) {
        return
    }

    stage.scale({ x: newScale, y: newScale })

    let newX = -(mousePointTo.x - pointer.x / newScale) * newScale
    let newY = -(mousePointTo.y - pointer.y / newScale) * newScale

    if (newX > 0) {
        newX = 0
    }

    if (newY > 0) {
        newY = 0
    }

    if (newX < -width) {
        newX = -width
    }

    if (newY < -height) {
        newY = -height
    }

    return {
        scale: newScale,
        x: newX,
        y: newY
    }
}

const dragHandler = (e: KonvaEventObject<DragEvent>, height: number, width: number) => {

    if (e.target.x() > 0) {
        e.target.x(0)
    }

    if (e.target.y() > 0) {
        e.target.y(0)
    }

    if (e.target.x() < -width) {
        e.target.x(-width)
    }

    if (e.target.y() < -height) {
        e.target.y(-height)
    }

    return {
        x: e.target.x(),
        y: e.target.y()
    }

}

const calculateTextHeight = (
    text: string,
    fontSize: number,
    fontFamily = "Arial",
    fontStyle = "normal"
) => {
    // Crée un objet Text temporaire pour mesurer la hauteur
    const tempText = new Konva.Text({
        text,
        fontSize,
        fontFamily,
        fontStyle,
    });

    // Récupère la hauteur du texte
    const textHeight = tempText.height();

    // Libère l'objet temporaire en le supprimant (si nécessaire)
    tempText.destroy();

    return textHeight;
};

function Heatmap({
    data,
    containerRef
}: {
    data: SymbolData[],
    containerRef: RefObject<HTMLDivElement>
}) {
    const fillWidth = false

    const navigate = useNavigate()

    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const containerSize = containerRef.current?.getBoundingClientRect()

    const width = containerSize?.width || 0;
    const height = containerSize?.height || 0;

    // Calculer le nombre optimal de colonnes et de lignes pour que les rectangles couvrent bien l'espace
    const totalItems = data.length;
    const rectSize = Math.sqrt((width * height) / totalItems) * 1

    let columnsCount = Math.floor(width / rectSize) - 1;
    columnsCount = Math.max(columnsCount, 1);

    const rectWidth = fillWidth ? width / columnsCount : rectSize * 1.5;

    const items: ItemData[] = []

    // let lastX = 0
    let lastY = 0
    let columnIndex = 0
    let rowIndex = 0

    for (let i = 0; i < data.length; i++) {
        const scaleFactor = Math.max(0.2, 3 * Math.exp(-i / (totalItems / 4)))

        lastY += rectSize * scaleFactor

        if (lastY >= height) {
            lastY = 0

            columnIndex++
            rowIndex = 0
        }

        items.push({
            ...data[i],
            columnIndex,
            rowIndex
        })

        rowIndex++
    }

    // Group items by column
    // [
    //      Column 0: [item1, item2, item3],
    //      Column 1: [item4, item5, item6],
    //    ...
    // ]
    const columns = items.reduce((acc, item) => {
        if (!acc[item.columnIndex]) {
            acc[item.columnIndex] = []
        }

        acc[item.columnIndex].push(item)

        return acc
    }, [] as ColumnData[])

    // Map the columns and calculate the position of each item and the height and width, based on the number of items in the column
    const allItems: AllItemsData[] = []
    for (const column of columns) {
        const totalColItems = column.length
        const rectHeight = height / totalColItems

        let lastY = 0
        // let rowIndex = 0

        for (const item of column) {
            const x = item.columnIndex * rectWidth
            const y = lastY

            allItems.push({
                ...item,
                x,
                y,
                rectHeight,
                rectWidth
            })

            lastY += rectHeight
        }

    }

    return (
        <Stage width={width} height={height}>
            <Layer
                draggable={true}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}

                onDragMove={(e) => {
                    const newPos = dragHandler(e, height, width)

                    if (newPos) {
                        setPosition(newPos)
                    }
                }}

                onWheel={(e) => {
                    const newPos = wheelHandler(e, height, width)

                    if (newPos) {
                        setPosition({
                            x: newPos.x,
                            y: newPos.y
                        })

                        setScale(newPos.scale)
                    }
                }}
            >
                {allItems.map((item) => {
                    const text = `${item.name}\n${item.price}€\n${item.change}%`
                    const smallText = `${item.name}`
                    const fontSize = 20

                    const textHeight = calculateTextHeight(text, fontSize, textConfig.fontFamily, textConfig.fontStyle)
                    const smallTextHeight = calculateTextHeight(smallText, fontSize, textConfig.fontFamily, textConfig.fontStyle)

                    const image = new window.Image()
                    image.src = `/api/image/symbol?name=${item.logo}`

                    // const imageSize = 40
                    const imageSize = fontSize * 2
                    const imageX = item.rectWidth / 2 - imageSize / 2
                    const imageY = item.rectHeight / 2 - imageSize * 1.5

                    const width = item.rectWidth;
                    const height = item.rectHeight;

                    return (
                        <Group
                            key={item.symbol}

                            x={item.x}
                            y={item.y}
                            clip={{
                                x: 0,
                                y: 0,
                                width: width,
                                height: height,
                            }}

                            onClick={() => {
                                navigate(`/data/${item.symbol}`)
                            }}


                        // onMouseOver={(e) => {
                        //     hoverHandler(e, item)
                        // }}
                        >
                            <Rect
                                height={height}
                                width={width}
                                fill={item.color.background}
                            />

                            {item.rectHeight > textHeight + (imageSize + 10) ? (
                                <Image
                                    x={imageX}
                                    y={imageY - 10}
                                    width={imageSize}
                                    height={imageSize}
                                    cornerRadius={99999}
                                    image={image}
                                />
                            ) : null}

                            {item.rectHeight > textHeight ? (
                                <Text
                                    x={0}
                                    y={height / 2 - textHeight / 2}
                                    width={width}
                                    align="center"
                                    text={text}
                                    fontSize={fontSize}
                                    fill={textConfig.fill}
                                    padding={5}
                                    fontStyle={textConfig.fontStyle}
                                />
                            ) : null}

                            {item.rectHeight < textHeight &&
                                item.rectHeight > smallTextHeight ? (
                                <Text
                                    x={0}
                                    y={height / 2 - smallTextHeight / 2}
                                    width={width}
                                    align="center"
                                    text={smallText}
                                    fontSize={fontSize}
                                    fill={textConfig.fill}
                                    padding={5}
                                    fontStyle={textConfig.fontStyle}
                                />
                            ) : null}
                        </Group>
                    )
                })}
            </Layer>
        </Stage>
    )
}