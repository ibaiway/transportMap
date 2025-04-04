import { Request, Response } from "express"
import { closeDb, getStops, openDb } from "gtfs"
import { gtfsConfig } from "../config/gtfs-config.ts"

export function handleGetStops(req: Request, res: Response) {
  const db = openDb(gtfsConfig)
  const stops = getStops(
    {}, // No query filters
    ["stop_id", "stop_name", "stop_lat", "stop_lon"], // Only return these fields
    [["stop_id", "ASC"]], // Sort by this field and direction
    { db: db } // Options for the query. Can specify which database to use if more than one are open
  )

  closeDb(db)
  res.send(stops)
}
