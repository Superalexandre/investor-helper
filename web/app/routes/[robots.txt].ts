import fs from "node:fs"

export const loader = () => {
	const content = fs.readFileSync("./app/resources/robots.txt", "utf-8")

	return new Response(content, {
		status: 200,
		headers: {
			"Content-Type": "text/plain",
			"xml-version": "1.0",
			encoding: "UTF-8"
		}
	})
}
