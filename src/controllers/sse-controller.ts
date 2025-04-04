import { Request, Response } from "express"
import { closeDb, getStoptimes, getStopTimeUpdates, openDb } from "gtfs"
import { gtfsConfig } from "../config/gtfs-config.ts"
import { getLiveStops } from "../services/livestops-service.ts"

export function handleLiveStops(req: Request, res: Response) {
  if (req.query.live === "false") {
    const stopId = req.params.stopId

    if (!stopId) {
      res.status(400).send("Stop ID is required")
      return
    }

    const enhancedStoptimes = getLiveStops(stopId)

    res.send(enhancedStoptimes)
  } else {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    const stopId = req.params.stopId

    if (!stopId) {
      res.status(400).send("Stop ID is required")
      return
    }

    // Send initial data
    const initialData = getLiveStops(stopId)
    res.write(`data: ${JSON.stringify(initialData)}\n\n`)

    // Set up interval to send updates every 20 seconds
    const interval = setInterval(() => {
      const data = getLiveStops(stopId)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }, 20000)

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(interval)
      res.end()
    })
  }
}
