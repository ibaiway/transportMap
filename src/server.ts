import express from "express"
import { router } from "./routes.ts"
import cron from "node-cron"
import { updateGtfsRealtime } from "gtfs"
import { gtfsConfig } from "./config/gtfs-config.ts"

const app = express()

app.get("/", (req, res) => {
  res.send("Express + Typescript is running")
})
app.use(router)

// Set up cron job to run every 20 seconds
cron.schedule("*/20 * * * * *", async () => {
  console.log("Updating GTFS realtime data")
  await updateGtfsRealtime(gtfsConfig)
  console.log("GTFS realtime data updated")
})

export { app }
