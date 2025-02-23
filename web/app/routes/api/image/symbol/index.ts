import { createAPIFileRoute } from "@tanstack/start/api"
import sharp from "sharp"
import logger from "../../../../../../log"

export const APIRoute = createAPIFileRoute("/api/image/symbol")({
	GET: async ({ request }) => {
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
		const format = formatParam ? formatParam.toLowerCase() : "png"

		const supportedFormats = ["png", "webp", "jpeg"]
		if (!supportedFormats.includes(format)) {
			return new Response(null, {
				status: 400
			})
		}

		const url = `https://s3-symbol-logo.tradingview.com/${imageName}.svg`
		const imageReq = await fetch(url)

		if (!imageReq.ok) {
			return new Response(null, {
				status: 404
			})
		}

		const imageArrayBuffer = await imageReq.arrayBuffer()
		const imageBuffer = Buffer.from(imageArrayBuffer)

		try {
			// Initialize sharp with the image buffer and high density for SVG rendering
			let sharpInstance = sharp(imageBuffer, { density: 300 }).resize(width, height, {
				fit: "inside", // Fit within dimensions
				withoutEnlargement: true // Prevent enlarging small images
			})

			if (["png"].includes(format)) {
				sharpInstance = sharpInstance.png({
					quality: 100, // PNG quality (0-100)
					compressionLevel: 6 // PNG compression level (0-9)
				})
			} else if (["jpeg", "jpg"].includes(format)) {
				sharpInstance = sharpInstance.jpeg({
					quality: 80, // JPEG quality (0-100)
					mozjpeg: true // Use MozJPEG for better compression
				})
			} else if (["webp"].includes(format)) {
				sharpInstance = sharpInstance.webp({
					quality: 80, // WebP quality (0-100)
					lossless: false, // Use lossy compression for smaller file size
					alphaQuality: 100 // Preserve transparency quality
				})
			} else {
				// Unsupported format
				return new Response(null, {
					status: 400
				})
			}

			// Convert the image to the specified format and get the buffer
			const processedImageBuffer = await sharpInstance.toBuffer()

			const maxAge = 60 * 60 * 24 * 7 // 1 week

			return new Response(processedImageBuffer, {
				headers: {
					"Content-Type": `image/${format === "jpg" ? "jpeg" : format}`,
					"Cache-Control": `public, max-age=${maxAge}, immutable`
				}
			})
		} catch (error) {
			logger.error(`Error processing image ${error}`, { error })

			return new Response(null, {
				status: 500
			})
		}
	}
})
