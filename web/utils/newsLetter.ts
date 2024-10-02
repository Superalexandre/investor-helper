import { GoogleGenerativeAI } from "@google/generative-ai"
import "dotenv/config"
import { getNewsFromDates } from "./news"
import nodemailer from "nodemailer"
import fs from "fs"

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY as string)
const model = googleAI.getGenerativeModel({
    "model": "gemini-1.5-flash",
})

interface Article {
    title: string
    description: string
}

export async function generateNewsLetter() {
    const from = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
    const to = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000)

    const newsJson = await getNewsFromDates(from, to)

    try {
        const prompt = `
        Generate a JSON object containing a newsletter with exactly 10 articles based on the provided JSON data. 
        Each article that you create should include the following fields: 'title' for a catchy title and 'description' for the full article (100-150 words) written in French. 
        Focus on the 10 most important topics present in the JSON content and ensure that the total number of articles does not exceed 10. Format the output as a valid JSON array, resembling the following structure: 
        [
            {
                "title": "",
                "description": ""
            },
            {
                "title": "",
                "description": ""
            }
        ]

        Here's the JSON data: ${JSON.stringify(newsJson)}.
        `

        // const prompt = "You will take a JSON and read it and take the 10 most important news of the days to do a news letter written in french, each article is about 100-150 words, you will return a valid json array that can be parsed in javascript, with the title, and the article as the description. The following JSON is " + JSON.stringify(newsJson)
        const result = await model.generateContent(prompt)

        const response = result.response
        const text = response.text()

        return text
    } catch (err) {
        console.error("Error generating news letter", err)
    }
}

export async function sendMail() {
    let emailTemplate = fs.readFileSync("../templates/newsLetter.html", "utf8")

    if (!emailTemplate) {
        console.error("Error reading email template")

        return
    }

    // let article = await generateNewsLetter()
    let article = fs.readFileSync("../templates/newsLetter.json", "utf8")
    if (!article) {
        console.error("Error generating article")

        return
    }

    // Replace potential ``` and ```json
    article = article
        .replace(/```json/g, "")
        .replace(/```/g, "")

    let articleJson: string | Article[] = ""
    try {
        fs.writeFileSync("../templates/rawNews.txt", article)

        articleJson = JSON.parse(article)

        fs.writeFileSync("../templates/newsLetter.json", JSON.stringify(articleJson))
    } catch (err) {
        console.error("Error parsing article", err)
    }

    if (!articleJson || articleJson.length === 0 || typeof articleJson === "string") {
        console.error("Error parsing article", articleJson)

        return
    }

    const articleHtml = articleJson.map((articleMap: Article) => {
        return `<h2>${articleMap.title}</h2><p>${articleMap.description}</p>`
    }).join("")

    console.log(articleHtml)

    emailTemplate = emailTemplate
        .replace(/{{content}}/g, articleHtml)

        
    const mailName = "newsletter@investor-helper.com"
    const transporter = nodemailer.createTransport({
        // service: "gmail",
        // host: "smtp.gmail.com",
        host: "investor-helper.com",
        // port: 25,
        port: 587,
        secure: false,
        auth: {
            user: "newsletter@investor-helper.com",
            // user: mailName,
            pass: process.env.MAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    try {
        const info = await transporter.sendMail({
            from: `Newsletter Investor Helper <${mailName}>`,
            to: "superalexandre0@gmail.com",
            subject: "Newsletter Investor Helper",
            html: emailTemplate,
    
            // dkim: {
            //     domainName: "investor-helper.com",
            //     keySelector: "default",
            //     privateKey: process.env.DKIM_PRIVATE_KEY as string,
            // }
        })

        console.log(info)
    } catch (err) {
        console.error("Error sending mail", err)
    }
}