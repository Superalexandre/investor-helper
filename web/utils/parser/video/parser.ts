import ytdl from "@distube/ytdl-core"
import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"
import ffmpeg from "fluent-ffmpeg"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import { PassThrough } from "node:stream"

// node --loader ts-node/esm ./web/utils/parser/video/parser.ts

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function videoParser(): Promise<void> {
	const youtubeUrl = "https://www.youtube.com/watch?v=nC8RLn1Bb7c"
	const resultPath = path.join(__dirname, "audio.mp3")

	// const videoInfo = await ytdl.getInfo(youtubeUrl)
	// const videoFormats = videoInfo.formats

	// const video = ytdl(youtubeUrl, {
	// 	quality: "highestaudio"
	// }).pipe(fs.createWriteStream(resultPath))

	// video.on("finish", () => {
	// 	console.log("Video downloaded")

	// })
    audioParser(resultPath)
}

async function audioParser(audioPath: string) {
	// Check if the path is valid
	if (!fs.existsSync(audioPath)) {
		console.error("File not found")
		return []
	}

	console.log("Audio path:", audioPath)

	// Check the size of the audio file
	const stats = fs.statSync(audioPath)
	const maxSize = 50 * 1024 * 1024 // 50MB

	const audioChunks: Buffer[] = []

	if (stats.size > maxSize) {
		console.log("File is too large, splitting into smaller chunks...")

		const chunkDuration = 300 // 5 minutes

		// Create a new ffmpeg command
        ffmpeg.setFfmpegPath(ffmpegInstaller.path)

		const command = ffmpeg(audioPath)
			.format("mp3") // Output format
			.duration(chunkDuration) // Split into chunks of `chunkDuration` seconds
			.on("error", (err) => {
				console.error("Error splitting audio:", err)
			})

		// Create a PassThrough stream to collect the output
		const stream = new PassThrough()
		const bufferChunks: Uint8Array[] = []

		stream.on("data", (chunk) => {
			bufferChunks.push(chunk) // Collect chunks of data
		})

		stream.on("end", () => {
			const buffer = Buffer.concat(bufferChunks)
			audioChunks.push(buffer) // Add the buffer to the audioChunks array
			console.log("Finished splitting audio into chunks")
		})

		stream.on("error", (err) => {
			console.error("Error processing stream:", err)
		})

		command.pipe(stream, { end: true })

		await new Promise<void>((resolve, reject) => {
			stream.on("end", resolve)
			stream.on("error", reject)
		})
	} else {
		console.log("File is within the size limit, no need to split.")
		const fileBuffer = fs.readFileSync(audioPath)
		audioChunks.push(fileBuffer)
	}

	// Parse the buffers
    // Get the mb size of each buffer
    console.log("Audio chunks:", audioChunks.length, audioChunks.map((chunk) => chunk.length / 1024 / 1024))
}

videoParser()
