import { Router } from "express"
import cors from "cors"

import {
  closeDb,
  getStoptimes,
  getStopTimeUpdates,
  importGtfs,
  openDb,
  updateGtfsRealtime,
} from "gtfs"
import { gtfsConfig } from "./config/gtfs-config.ts"
import { handleGetStops } from "./controllers/stops-controller.ts"
import { handleGetRoutes } from "./controllers/routes-controller.ts"
import { handleLiveStops } from "./controllers/sse-controller.ts"

const router = Router()

router.use(
  cors({
    origin: "*", // allow all origins in development
    credentials: true, // if you're using cookies or authentication
  })
)

router.get("/import", async (req, res) => {
  await importGtfs(gtfsConfig)
  res.send("This is the import route")
})

router.get("/import-rt", async (req, res) => {
  await updateGtfsRealtime(gtfsConfig)
  res.send("This is the import route real time")
})

router.get("/stops", handleGetStops)

router.get("/routes", handleGetRoutes)

router.get("/livestops/:stopId", handleLiveStops)

export { router }
