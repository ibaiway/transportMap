import { Request, Response } from "express"
import { closeDb, getRoutes, openDb } from "gtfs"
import { gtfsConfig } from "../config/gtfs-config.ts"

export function handleGetRoutes(req: Request, res: Response) {
  const db = openDb(gtfsConfig)
  const routes = getRoutes(
    {}, // No query filters
    ["route_id", "route_short_name", "route_long_name", "route_color"], // Only return these fields
    [["route_id", "ASC"]], // Sort by this field and direction
    { db: db } // Options for the query. Can specify which database to use if more than one are open
  )

  closeDb(db)
  res.send(routes)
}
