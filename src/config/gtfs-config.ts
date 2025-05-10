import { Config } from "gtfs"

const gtfsConfig: Config = {
  sqlitePath: "./db/gtfs.db",

  ignoreDuplicates: false,
  agencies: [
    {
      url: "https://opendata.euskadi.eus/transport/moveuskadi/dbus/gtfs_dbus.zip",
      prefix: "dbus",
      realtimeTripUpdates: {
        url: "https://opendata.euskadi.eus/transport/moveuskadi/dbus/gtfsrt_dbus_trip_updates.pb",
      },
    },
    {
      url: "https://opendata.euskadi.eus/transport/moveuskadi/lurraldebus/ekialdebus/gtfs_ekialdebus.zip",
      prefix: "ekialdebus",
      realtimeTripUpdates: {
        url: "https://opendata.euskadi.eus/transport/moveuskadi/lurraldebus/ekialdebus/gtfsrt_ekialdebus_vehicle_positions.pb",
      },
    },
    {
      url: "https://opendata.euskadi.eus/transport/moveuskadi/euskotren/gtfs_euskotren.zip",
      prefix: "euskotren",
    },
  ],
}

export { gtfsConfig }
