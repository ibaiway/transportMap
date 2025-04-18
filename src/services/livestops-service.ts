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

  // Get time 30 minutes ago to catch delayed buses
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
  const startTime = thirtyMinutesAgo.toLocaleTimeString("en-US", {
    hour12: false,
  })

  // Get scheduled stoptimes for next hour, including buses from 30 minutes ago
  const stoptimes = getStoptimes(
    {
      stop_id: stopId,
      date: currentDate,
      start_time: startTime, // Changed from currentTime to startTime
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

  // Create lookup of updates by trip_id
  const updatesByTripId = updates.reduce((acc, update) => {
    acc[update.trip_id] = update
    return acc
  }, {})

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

  // Filter out buses that have already departed (accounting for delays)
  const filteredStoptimes = enhancedStoptimes.filter((stoptime) => {
    // If we have delay information, use the adjusted departure time
    if (stoptime.delay && stoptime.delay.adjusted_departure_time) {
      const [hours, minutes, seconds] =
        stoptime.delay.adjusted_departure_time.split(":")
      const adjustedDepartureDate = new Date(
        0,
        0,
        0,
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )
      const currentTimeDate = new Date(
        0,
        0,
        0,
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      )
      return adjustedDepartureDate >= currentTimeDate
    }

    // Otherwise use the scheduled departure time
    const [hours, minutes, seconds] = stoptime.departure_time.split(":")
    const departureDate = new Date(
      0,
      0,
      0,
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )
    const currentTimeDate = new Date(
      0,
      0,
      0,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
    return departureDate >= currentTimeDate
  })

  closeDb(db)
  return filteredStoptimes
}
