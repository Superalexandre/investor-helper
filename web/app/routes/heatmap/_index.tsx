import type { MetaFunction } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { ClientOnly } from "remix-utils/client-only"
import { Stage, Layer, Rect, Text, Image, Group } from "react-konva"
import { type RefObject, useRef, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";

interface SymbolData {
    name: string
    symbol: string
    color: string
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

export async function loader() {

    const body = {
        "columns": [
            "close",
            "currency",
            "exchange",
            "change",
            "logoid"
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
            "symbolset": [
                "SYML:SP;SPX"
            ]
        },
        "markets": [
            "america"
        ],
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

    const res = await fetch("https://scanner.tradingview.com/america/scan?label-product=heatmap-stock", {
        method: "POST",
        body: JSON.stringify(body)
    })

    const json = await res.json()
    const data: SymbolData[] = []

    for (const item of json.data) {
        const change = item.d[3]

        const green = "#33cc66"
        const red = "#ef4444"
        const gray = "#6b7280"

        let color = gray
        if (change > 0.5) {
            color = green
        } else if (change < -0.5) {
            color = red
        }

        data.push({
            name: item.s,
            symbol: item.s,
            color: color,
            price: item.d[0],
            currency: item.d[1],
            exchange: item.d[2],
            change: item.d[3] ? item.d[3].toFixed(2) : 0,
            logo: item.d[4]
        })
    }


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
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div className="h-full flex-1" ref={containerRef}>
            <ClientOnly fallback={<p>Chargement</p>}>
                {() => (
                    <>
                        <Heatmap data={data} containerRef={containerRef} />
                    
                        <div className="absolute bottom-0 left-0 m-4 flex flex-row items-center gap-4">
                            <img src="/logo-1024-1024.webp" alt="Investor Helper" className="h-16 w-16" />
                            
                            <p className="font-bold text-lg">Investor Helper</p>
                        </div>
                    </>

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

function Heatmap({
    data,
    containerRef
}: {
    data: SymbolData[],
    containerRef: RefObject<HTMLDivElement>
}) {
    const navigate = useNavigate()

    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    // console.log(data)

    // Obtenir la taille de l'écran

    const containerSize = containerRef.current?.getBoundingClientRect()

    const width = containerSize?.width || 0;
    const height = containerSize?.height || 0;

    // Calculer le nombre optimal de colonnes et de lignes pour que les rectangles couvrent bien l'espace
    const totalItems = data.length;
    const rectSize = Math.sqrt((width * height) / totalItems)// * 1.5

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
            // const scaleFactor = Math.max(0.2, 1 * Math.exp(-item.columnIndex / (totalColItems / 4)))

            // console.log(scaleFactor)

            const rectWidth = rectSize + 50// * scaleFactor
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
                    const textHeight = 15

                    const image = new window.Image()
                    image.src = `/api/image/symbol?name=${item.logo}`

                    const imageSize = 40
                    const imageX = item.x + item.rectWidth / 2 - imageSize / 2
                    const imageY = item.y + item.rectHeight / 2 - imageSize * 1.5

                    return (
                        <Group 
                            key={item.symbol}
                            
                            onClick={() => {
                                navigate(`/data/${item.symbol}`)
                            }}


                            // onMouseOver={(e) => {
                            //     hoverHandler(e, item)
                            // }}
                        >
                            <Rect
                                x={item.x}
                                y={item.y}
                                height={item.rectHeight}
                                width={item.rectWidth}
                                fill={item.color}
                                stroke="yellow"
                            />

                            <Image
                                x={imageX}
                                y={imageY}
                                width={imageSize}
                                height={imageSize}
                                cornerRadius={99999}
                                image={image}
                            />

                            <Text
                                x={item.x}
                                y={item.y + item.rectHeight / 2 - textHeight}
                                width={item.rectWidth}
                                align="center"

                                text={text}
                                fontSize={12}
                                fill="#333"
                            />
                        </Group>
                    )
                })}
            </Layer>
        </Stage>
    )
}