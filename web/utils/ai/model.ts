import { GoogleGenerativeAI } from "@google/generative-ai"
import "dotenv/config"

const googleAi = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY as string)
const model = googleAi.getGenerativeModel({
    model: "gemini-1.5-flash"
})

export default model