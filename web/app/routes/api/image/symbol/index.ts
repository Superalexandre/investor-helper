import type { LoaderFunction } from "@remix-run/node"
import sharp, { type AvailableFormatInfo } from "sharp"
import logger from "../../../../../../log"

export const loader: LoaderFunction = async({ request }) => {
	const requestUrl = new URL(request.url)
	const imageName = requestUrl.searchParams.get("name")

	const widthParam = requestUrl.searchParams.get("width")
	const heightParam = requestUrl.searchParams.get("height")
	const formatParam = requestUrl.searchParams.get("format")

	if (!imageName) {
		return new Response(null, {
			status: 400
		})
	}

	const width = widthParam ? Number.parseInt(widthParam) : undefined
	const height = heightParam ? Number.parseInt(heightParam) : undefined
	const format = formatParam ? formatParam : "png"

	const url = `https://s3-symbol-logo.tradingview.com/${imageName}.svg`
	const imageReq = await fetch(url)

	if (!imageReq.ok) {
		return null
	}

	const imageArrayBuffer = await imageReq.arrayBuffer()
	const imageBuffer = Buffer.from(imageArrayBuffer)

	try {
		const processedImageBuffer = await sharp(imageBuffer)
			.resize(width, height, {
				fit: "contain",
				position: "center",
				withoutReduction: true
			})
			.toFormat(format as unknown as AvailableFormatInfo, {
				quality: 100,
				compressionLevel: 0
				// compression
			})
			.toBuffer()

		return new Response(processedImageBuffer, {
			headers: {
				"Content-Type": `image/${format}`,
				"Cache-Control": "public, max-age=604800, immutable"
			}
		})
	} catch (error) {
		logger.error(`Error processing image ${error}`, { error })
	
		return new Response(null, {
			status: 500
		})
	}
	// const imageBlob = await imageReq.blob()
	// return new Response(imageBlob, {
	// 	headers: {
	// 		"Content-Type": "image/svg+xml",
	// 		"Cache-Control": "public, max-age=604800, immutable"
	// 	}
	// })
}
