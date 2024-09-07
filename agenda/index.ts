import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono()
app.use(cors())
app.get("/api/agenda", (req) => {
    return req.json({ message: "Hello from agenda" })
})