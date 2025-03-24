import { Router } from "express"
import { importGtfs } from "gtfs"
import { gtfsConfig } from "./config/gtfs-config.ts"

const router = Router()

router.get("/import", async (req, res) => {
  await importGtfs(gtfsConfig)
  res.send("This is the import route")
})

export { router }
