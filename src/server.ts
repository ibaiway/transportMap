import express from "express"
import { router } from "./routes.ts"
const app = express()

app.get("/", (req, res) => {
  res.send("Express + Typescript is running")
})
app.use(router)

export { app }
