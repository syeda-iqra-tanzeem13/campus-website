import { useEffect, useMemo, useState } from "react";
import L from "leaflet";

import {
  MapContainer,
  GeoJSON,
  Polyline,
  Rectangle,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import roomsUrl from "../data/rooms.geojson?url";

const FLOOR_HEIGHT = 7000;

const FLOOR_BOUNDS = [
  [0, 0],
  [FLOOR_HEIGHT, 4800],
];

function roomStyle(feature, selectedId) {
  const id = feature.properties.id;

  // Selected room
  if (id === selectedId) {
    return {
      color: "#2B490E",
      weight: 3,
      fillColor: "#E2C750",
      fillOpacity: 0.95,
    };
  }

  // Wall
  if (feature.properties.kind === "wall") {
    return {
      color: "#2B490E",
      weight: 9,
      fillOpacity: 0,
    };
  }

  // Area
  if (feature.properties.kind === "area") {
    return {
      color: "#78913D",
      weight: 2.4,
      dashArray: "7 5",
      fillColor: feature.properties.color || "#78913D",
      fillOpacity: 0.16,
    };
  }

  // Garden
  if (feature.properties.kind === "garden") {
    return {
      color: "#2B490E",
      weight: 2.4,
      fillColor: "#78913D",
      fillOpacity: 0.88,
    };
  }

  // Path
  if (feature.properties.kind === "path") {
    return {
      color: "#7B5CA5",
      weight: 2,
      dashArray: "5 5",
      fillColor: feature.properties.color || "#B8A1CF",
      fillOpacity: 0.32,
    };
  }

  // Normal room
  return {
    color: "#542B7E",
    weight: 1.3,
    fillColor: feature.properties.color || "#B8A1CF",
    fillOpacity: 0.82,
  };
}

function center(feature) {
  const [x, y, w, h] = feature.properties.bounds;

  return [FLOOR_HEIGHT - (y + h / 2), x + w / 2];
}

function title(feature) {
  return feature.properties.code
    ? `${feature.properties.code} — ${feature.properties.name}`
    : feature.properties.name;
}

function isNavigable(feature) {
  return !["wall", "area", "path"].includes(feature.properties.kind);
}

function FitFloor() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(FLOOR_BOUNDS, {
      padding: [34, 34],
    });

    map.setZoom(map.getZoom() - 0.45);
  }, [map]);

  return null;
}

function InteractiveFloorMap() {
  const [rooms, setRooms] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);

  const [startLocation, setStartLocation] = useState("entrance");

  const [destination, setDestination] = useState("");

  const [route, setRoute] = useState([]);

  const [routeMessage, setRouteMessage] = useState("");

  // LOAD GEOJSON
  useEffect(() => {
    fetch(roomsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load rooms.geojson");
        }

        return response.json();
      })
      .then((data) => {
        setRooms(data.features);
      })
      .catch((error) => {
        console.error(error);

        setRouteMessage("Unable to load the map data.");
      });
  }, []);

  // GEOJSON OBJECT
  const geoJsonData = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: rooms,
    };
  }, [rooms]);

  function pointFor(id) {
    if (id === "entrance") {
      return [FLOOR_HEIGHT - 6309, 666];
    }

    const feature = rooms.find((room) => room.properties.id === id);

    return feature ? center(feature) : null;
  }

  function distance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function planPoint(x, y) {
    return [FLOOR_HEIGHT - y, x];
  }

  const corridorRows = [800, 2400, 3000, 5070, 5600, 6300];

  const corridorColumns = [660, 800, 3220, 3600];

  const corridorGrid = corridorColumns.flatMap((x) =>
    corridorRows.map((y) => planPoint(x, y)),
  );

  function nearestCorridor(point) {
    return corridorGrid.reduce(
      (best, candidate) =>
        distance(point, candidate) < distance(point, best) ? candidate : best,
      corridorGrid[0],
    );
  }

  function roomEdge(feature, toward) {
    if (!feature) {
      return pointFor("entrance");
    }

    const [x, y, w, h] = feature.properties.bounds;

    const roomCenter = center(feature);

    const choices = [
      [FLOOR_HEIGHT - y, roomCenter[1]],

      [FLOOR_HEIGHT - y - h, roomCenter[1]],

      [roomCenter[0], x],

      [roomCenter[0], x + w],
    ];

    return choices.reduce(
      (best, candidate) =>
        distance(candidate, toward) < distance(best, toward) ? candidate : best,
      choices[0],
    );
  }

  function showRoute() {
    if (!destination) {
      setRouteMessage("Choose a destination first.");

      return;
    }

    const originFeature = rooms.find(
      (room) => room.properties.id === startLocation,
    );

    const destinationFeature = rooms.find(
      (room) => room.properties.id === destination,
    );

    if (!destinationFeature) {
      return;
    }

    const originCenter = originFeature
      ? center(originFeature)
      : pointFor("entrance");

    const targetCenter = center(destinationFeature);

    const originLane = nearestCorridor(originCenter);

    const targetLane = nearestCorridor(targetCenter);

    const startPoint = originFeature
      ? roomEdge(originFeature, originLane)
      : originCenter;

    const endPoint = roomEdge(destinationFeature, targetLane);

    const turn = [originLane[0], targetLane[1]];

    const newRoute = [startPoint, originLane, turn, targetLane, endPoint];

    setRoute(newRoute);

    setSelectedRoom(destinationFeature);

    setRouteMessage(`Corridor route shown to ${title(destinationFeature)}.`);
  }

  function resetMap() {
    setSelectedRoom(null);
    setRoute([]);
    setRouteMessage("");
    setDestination("");
  }

  return (
    <div className="interactive-floor-map">
      {/* CONTROLS */}

      <div className="map-navigation-controls">
        <div className="map-select-group">
          <label>Current Location</label>

          <select
            value={startLocation}
            onChange={(event) => setStartLocation(event.target.value)}
          >
            <option value="entrance">Entrance</option>

            {rooms.filter(isNavigable).map((room) => (
              <option key={room.properties.id} value={room.properties.id}>
                {title(room)}
              </option>
            ))}
          </select>
        </div>

        <div className="map-select-group">
          <label>Destination</label>

          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">Select destination</option>

            {rooms.filter(isNavigable).map((room) => (
              <option key={room.properties.id} value={room.properties.id}>
                {title(room)}
              </option>
            ))}
          </select>
        </div>

        <div className="map-button-group">
          <button onClick={showRoute}>Directions</button>

          <button onClick={resetMap}>Reset</button>
        </div>
      </div>

      {/* MAP */}

      <div className="leaflet-map-wrapper">
        <MapContainer
          crs={L.CRS.Simple}
          minZoom={-2}
          maxZoom={2}
          zoomSnap={0.25}
          attributionControl={false}
          className="leaflet-floor-map"
        >
          <FitFloor />

          <Rectangle
            bounds={FLOOR_BOUNDS}
            pathOptions={{
              color: "#7B5CA5",
              weight: 2,
              fillColor: "#F4EFF8",
              fillOpacity: 1,
            }}
            interactive={false}
          />

          {rooms.length > 0 && (
            <GeoJSON
              key={selectedRoom?.properties.id || "no-room"}
              data={geoJsonData}
              pointToLayer={(feature) => {
                const [x, y, w, h] = feature.properties.bounds;

                const bounds = [
                  [FLOOR_HEIGHT - y - h, x],

                  [FLOOR_HEIGHT - y, x + w],
                ];

                return L.rectangle(
                  bounds,
                  roomStyle(feature, selectedRoom?.properties.id),
                );
              }}
              onEachFeature={(feature, layer) => {
                layer.on("click", () => {
                  if (isNavigable(feature)) {
                    setSelectedRoom(feature);
                  }
                });
              }}
            />
          )}

          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#2B490E",
                weight: 6,
                opacity: 0.94,
                lineJoin: "round",
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* ROUTE MESSAGE */}

      {routeMessage && <p className="route-message">{routeMessage}</p>}

      {/* ROOM INFORMATION */}

      {selectedRoom && (
        <div className="interactive-room-info">
          <h2>{title(selectedRoom)}</h2>

          <p>
            <strong>Location Type:</strong>{" "}
            {selectedRoom.properties.type || "Room"}
          </p>

          <p>
            <strong>Floor:</strong>{" "}
            {selectedRoom.properties.floor || "Ground Floor"}
          </p>

          {selectedRoom.properties.description && (
            <p>
              <strong>Description:</strong>{" "}
              {selectedRoom.properties.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default InteractiveFloorMap;
