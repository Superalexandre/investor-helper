// const fs = require('fs');
// import { compress } from "compressed-json"
import Database from "better-sqlite3"
import { compress } from "compress-json"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { stringify as compressZip } from "zipson"
import { newsArticleSchema } from "./schema/news"
import { desc, sql } from "drizzle-orm"
import fs from "node:fs"
import zlib from "node:zlib"

// node --loader ts-node/esm ./db/jsonTest.ts

function prettySize(size: number) {
	const i = Math.floor(Math.log(size) / Math.log(1024))
	return `${(size / 1024 ** i).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`
}

function getJsonSize(string: string | Buffer, pretty = true) {
	const bytes = Buffer.byteLength(string, "utf8")

	if (!pretty) {
		return bytes
	}

	return prettySize(bytes)
}

// biome-ignore lint/suspicious/useAwait: <explanation>
// biome-ignore lint/nursery/useExplicitType: <explanation>
async function main() {
	// Get in the database the biggest JSON
	// And compare them
	const save = false

	const sqlite = new Database("./db/sqlite.db")
	const db = drizzle(sqlite)

	const jsons = await db
		.select()
		.from(newsArticleSchema)
		.orderBy(desc(sql`LENGTH(${newsArticleSchema.jsonDescription})`))
	// .limit(200)

	const average = {
		json: 0,
		compressedZip: 0,
		compressedJson: 0,
		base64: 0,
		zlib: 0
	}

	for (const json of jsons) {
		const id = Date.now()
		const mainJson = json.jsonDescription

		// console.log(`\n${mainJson}`)

		const jsonSize = getJsonSize(mainJson, false) as number

		const compressedZip = compressZip(mainJson)
		const compressedSize = getJsonSize(compressedZip, false) as number

		const compressedJson = compress(JSON.parse(mainJson))
		const compressedJsonSize = getJsonSize(compressedJson.toString(), false) as number

		const base64 = Buffer.from(mainJson).toString("base64")
		const base64Size = getJsonSize(base64, false) as number

		const zlibCompressed = zlib.deflateSync(mainJson).toString("base64")
		const zlibSize = getJsonSize(zlibCompressed, false) as number

		if (save) {
			// Make dir if not exists
			if (!fs.existsSync(`./db/results/${id}`)) {
				fs.mkdirSync(`./db/results/${id}`)
			}

			fs.writeFileSync(`./db/results/${id}/json.json`, mainJson)
			fs.writeFileSync(`./db/results/${id}/compressedZip.txt`, compressedZip)
			fs.writeFileSync(`./db/results/${id}/compressedJson.txt`, JSON.stringify(compressedJson))
			fs.writeFileSync(`./db/results/${id}/base64.txt`, base64)
			fs.writeFileSync(`./db/results/${id}/zlib.txt`, zlibCompressed)
		}

		average.json += jsonSize
		average.compressedZip += compressedSize
		average.compressedJson += compressedJsonSize
		average.base64 += base64Size
		average.zlib += zlibSize

		// console.table([
		// 	{ name: "JSON", bytes: jsonSize.bytes, kiloBytes: jsonSize.kiloBytes },
		// 	{
		// 		name: "Compressed Zip",
		// 		bytes: compressedSize.bytes,
		// 		kiloBytes: compressedSize.kiloBytes
		// 	},
		// 	{
		// 		name: "Compressed JSON",
		// 		bytes: compressedJsonSize.bytes,
		// 		kiloBytes: compressedJsonSize.kiloBytes
		// 	},
		//     {
		//         name: "Base64",
		//         bytes: base64Size.bytes,
		//         kiloBytes: base64Size.kiloBytes
		//     }
		// ])
	}

	average.json /= jsons.length
	average.compressedZip /= jsons.length
	average.compressedJson /= jsons.length
	average.base64 /= jsons.length
	average.zlib /= jsons.length

	console.table([
		{ name: "Average" },
		{ name: "JSON", bytes: average.json, pretty: prettySize(average.json) },
		{ name: "Compressed Zip", bytes: average.compressedZip, pretty: prettySize(average.compressedZip) },
		{ name: "Compressed JSON", bytes: average.compressedJson, pretty: prettySize(average.compressedJson) },
		{ name: "Base64", bytes: average.base64, pretty: prettySize(average.base64) },
		{ name: "Zlib", bytes: average.zlib, pretty: prettySize(average.zlib) }
	])

	// console.table([
	//     { name: "Average" },
	//     { name: "JSON", bytes: average.json, kiloBytes: (average.json / 1024).toFixed(2) },
	//     { name: "Compressed Zip", bytes: average.compressedZip, kiloBytes: (average.compressedZip / 1024).toFixed(2) },
	//     { name: "Compressed JSON", bytes: average.compressedJson, kiloBytes: (average.compressedJson / 1024).toFixed(2) },
	//     { name: "Base64", bytes: average.base64, kiloBytes: (average.base64 / 1024).toFixed(2) },
	//     { name: "Zlib", bytes: average.zlib, kiloBytes: (average.zlib / 1024).toFixed(2) }
	// ])
}

main()
