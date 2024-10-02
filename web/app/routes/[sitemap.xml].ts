import fs from "fs"

export const loader = () => {
    const content = fs.readFileSync("./app/resources/sitemap.xml", "utf-8")

    return new Response(content, {
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "xml-version": "1.0",
            "encoding": "UTF-8"
        }
    })
}