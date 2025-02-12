import { getNewsFromDates } from "../../news"
import nodemailer from "nodemailer"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import logger from "../../../../log"
import model from "../model"

interface Article {
	title: string
	description: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// node --loader ts-node/esm ./utils/ai/newsLetter/generate.ts

async function generateNewsLetter() {
	const from = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
	const to = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000)

	const newsJson = await getNewsFromDates(from, to, {
        lang: ["fr-FR"],
        importanceScore: 50
    })

	try {
		let prompt = fs.readFileSync(path.join(__dirname, "prompt.txt"), "utf8")
		prompt = prompt.replace(/{{newsJson}}/g, JSON.stringify(newsJson))

		const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${process.env.OPENROUTER_AI_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: "google/learnlm-1.5-pro-experimental:free",
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: prompt
							}
						]
					}
				]
			})
		})

        const jsonResult = await res.json()

        if (jsonResult.error) {
            logger.error("Error generating the analysis", jsonResult.error)
            return null
        }

        const text = jsonResult.choices[0].message.content

		return text
	} catch (err) {
		console.error("Error generating news letter", err)
	}
}

async function generateEmail() {
	let emailTemplate = fs.readFileSync("../templates/newsLetter.html", "utf8")

	if (!emailTemplate) {
		logger.error("Error reading email template")

		return
	}

    logger.info("Generating newsletter")
	let article = await generateNewsLetter()
	// let article = fs.readFileSync("../templates/newsLetter.json", "utf8")
	if (!article) {
		logger.error("Error generating article")

		return
	}

    logger.success("Article generated")

	// Replace potential ``` and ```json
	article = article.replace(/```json/g, "").replace(/```/g, "")

	let articleJson: string | Article[] = ""
	try {
		fs.writeFileSync(path.join(__dirname, "newsLetter.txt"), article)

		articleJson = JSON.parse(article)

		fs.writeFileSync(path.join(__dirname, "newsLetter.json"), JSON.stringify(articleJson))
	} catch (err) {
		console.error("Error parsing article", err)
	}

	if (!articleJson || articleJson.length === 0 || typeof articleJson === "string") {
		console.error("Error parsing article", articleJson)

		return
	}

	const articleHtml = articleJson
		.map((articleMap: Article) => {
			return `<h2>${articleMap.title}</h2><p>${articleMap.description}</p>`
		})
		.join("")

	emailTemplate = emailTemplate.replace(/{{content}}/g, articleHtml)

    // Save the result in a file
    fs.writeFileSync(path.join(__dirname, "newsLetter.html"), emailTemplate)

	// const mailName = "newsletter@investor-helper.com"
	// const transporter = nodemailer.createTransport({
	// 	// service: "gmail",
	// 	// host: "smtp.gmail.com",
	// 	host: "investor-helper.com",
	// 	// port: 25,
	// 	port: 587,
	// 	secure: false,
	// 	auth: {
	// 		user: "newsletter@investor-helper.com",
	// 		// user: mailName,
	// 		pass: process.env.MAIL_PASSWORD
	// 	},
	// 	tls: {
	// 		rejectUnauthorized: false
	// 	}
	// })

	// try {
	// 	const info = await transporter.sendMail({
	// 		from: `Newsletter Investor Helper <${mailName}>`,
	// 		to: "superalexandre0@gmail.com",
	// 		subject: "Newsletter Investor Helper",
	// 		html: emailTemplate

	// 		// dkim: {
	// 		//     domainName: "investor-helper.com",
	// 		//     keySelector: "default",
	// 		//     privateKey: process.env.DKIM_PRIVATE_KEY as string,
	// 		// }
	// 	})

	// 	console.log(info)
	// } catch (err) {
	// 	console.error("Error sending mail", err)
	// }
}

generateEmail()