import { closeDb } from "gtfs"

import { getStoptimes, getStopTimeUpdates, openDb } from "gtfs"
import { gtfsConfig } from "../config/gtfs-config.ts"

export function getLiveStops(stopId: string) {
  const db = openDb(gtfsConfig)

  // Get current time
  const now = new Date()
  const currentTime = now.toLocaleTimeString("en-US", { hour12: false })
  const currentDate =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  console.log("DATE: ", currentDate)

  // Get time one hour from now
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const endTime = oneHourFromNow.toLocaleTimeString("en-US", {
    hour12: false,
  })

  // Get scheduled stoptimes for next hour
  const stoptimes = getStoptimes(
    {
      stop_id: stopId,
      date: currentDate,
      start_time: currentTime,
      end_time: endTime,
    },
    ["trip_id", "arrival_time", "departure_time", "stop_sequence", "stop_id"],
    [["departure_time", "ASC"]],
    { db: db }
  )

  // Extract trip_ids from stoptimes to filter updates
  const tripIds = stoptimes.map((stoptime) => stoptime.trip_id)

  // Get realtime updates
  const updates = getStopTimeUpdates(
    {
      trip_Id: tripIds,
    },
    ["trip_id", "arrival_delay", "departure_delay"],
    undefined,
    { db: db }
  )
  console.log("UPDATES: ", updates)

  // Create lookup of updates by trip_id
  const updatesByTripId = updates.reduce((acc, update) => {
    acc[update.trip_id] = update
    return acc
  }, {})

  console.log("UPDATES BY TRIP ID: ", updatesByTripId)

  // Enhance stoptimes with route and realtime information
  const enhancedStoptimes = stoptimes.map((stoptime) => {
    // Get trip information to find the route_id
    const trip = db
      .prepare(
        `
                SELECT route_id FROM trips WHERE trip_id = ?
              `
      )
      .get(stoptime.trip_id)

    if (!trip) return stoptime

    // Get route information
    const route = db
      .prepare(
        `
                SELECT route_id, route_short_name, route_long_name, route_color 
                FROM routes WHERE route_id = ?
              `
      )
      .get(trip.route_id)

    // Get realtime update if available
    const update = updatesByTripId[stoptime.trip_id]
    console.log("UPDATE: ", update)
    // Calculate adjusted times if there are delays
    let adjustedArrival = stoptime.arrival_time
    let adjustedDeparture = stoptime.departure_time

    if (update) {
      if (update.arrival_delay) {
        const [hours, minutes, seconds] = stoptime.arrival_time.split(":")
        const arrivalDate = new Date(0, 0, 0, hours, minutes, seconds)
        arrivalDate.setSeconds(arrivalDate.getSeconds() + update.arrival_delay)
        adjustedArrival = arrivalDate.toLocaleTimeString("en-US", {
          hour12: false,
        })
      }

      if (update.departure_delay) {
        const [hours, minutes, seconds] = stoptime.departure_time.split(":")
        const departureDate = new Date(0, 0, 0, hours, minutes, seconds)
        departureDate.setSeconds(
          departureDate.getSeconds() + update.departure_delay
        )
        adjustedDeparture = departureDate.toLocaleTimeString("en-US", {
          hour12: false,
        })
      }
    }

    // Combine all information
    return {
      ...stoptime,
      route: route || null,
      delay: update
        ? {
            arrival_delay: update.arrival_delay,
            departure_delay: update.departure_delay,
            adjusted_arrival_time: adjustedArrival,
            adjusted_departure_time: adjustedDeparture,
          }
        : null,
    }
  })

  closeDb(db)
  return enhancedStoptimes
}
