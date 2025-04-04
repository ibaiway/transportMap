import { Config } from "gtfs"

const gtfsConfig: Config = {
  sqlitePath: "./db/gtfs.db",
  agencies: [
    {
      url: "https://opendata.euskadi.eus/transport/moveuskadi/dbus/gtfs_dbus.zip",
      realtimeTripUpdates: {
        url: "https://opendata.euskadi.eus/transport/moveuskadi/dbus/gtfsrt_dbus_trip_updates.pb",
      },
    },
  ],
}

export { gtfsConfig }
