import { useEffect, useRef, useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./GroundFloorMap.css";

const FLOOR_HEIGHT = 7000;

const FLOOR_BOUNDS = [
  [0, 0],
  [FLOOR_HEIGHT, 4800],
];

function GroundFloorMap() {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const roomLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [rooms, setRooms] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [start, setStart] = useState("entrance");

  const [destination, setDestination] = useState("");

  const [routeMessage, setRouteMessage] = useState(
    "Choose a destination to show a walking route.",
  );

  /* =========================================================
     SIDEBAR STATE

     CLOSED when the page first opens.
     ========================================================= */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =========================================================
     LEAFLET MAP
  ========================================================= */

  useEffect(() => {
    if (leafletMapRef.current) {
      return;
    }

    if (!mapRef.current) {
      console.error("MAP CONTAINER NOT FOUND");
      return;
    }

    const map = L.map(mapRef.current, {
      crs: L.CRS.Simple,

      minZoom: -2,

      maxZoom: 4,

      zoomSnap: 0.25,

      attributionControl: false,

      /*
       * Keep Leaflet's own + / - buttons.
       */
      zoomControl: true,
    });

    leafletMapRef.current = map;

    /* =======================================================
       FIT THE WHOLE FLOOR
    ======================================================= */

    function showWholeFloor() {
      if (!leafletMapRef.current) {
        return;
      }

      map.invalidateSize({
        animate: false,
      });

      /*
       * Fit the complete floor inside the
       * currently available map area.
       *
       * Because the sidebar is closed initially,
       * the map gets almost the entire screen.
       */
      map.fitBounds(FLOOR_BOUNDS, {
        padding: [20, 20],
        animate: false,
      });
    }

    /*
     * Wait until the browser finishes laying out
     * the map before calculating its size.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        showWholeFloor();
      });
    });

    /* =======================================================
       RESPONSIVE RESIZING
    ======================================================= */

    let resizeObserver;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (!leafletMapRef.current) {
          return;
        }

        map.invalidateSize({
          animate: false,
        });
      });

      resizeObserver.observe(mapRef.current);
    }

    function handleWindowResize() {
      if (!leafletMapRef.current) {
        return;
      }

      map.invalidateSize({
        animate: false,
      });
    }

    window.addEventListener("resize", handleWindowResize);

    /* =======================================================
       FLOOR BACKGROUND
    ======================================================= */

    L.rectangle(FLOOR_BOUNDS, {
      color: "#7B5CA5",
      weight: 2,
      fillColor: "#F4EFF8",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);

    /* =======================================================
       LOAD ROOMS
    ======================================================= */

    fetch("/rooms.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load rooms.geojson");
        }

        return response.json();
      })
      .then((data) => {
        setRooms(data.features);

        function roomStyle(feature) {
          if (feature.properties.kind === "wall") {
            return {
              color: "#2B490E",
              weight: 9,
              fillOpacity: 0,
            };
          }

          if (feature.properties.kind === "area") {
            return {
              color: "#78913D",
              weight: 2.4,
              dashArray: "7 5",
              fillColor: feature.properties.color || "#78913D",
              fillOpacity: 0.16,
            };
          }

          if (feature.properties.kind === "garden") {
            return {
              color: "#2B490E",
              weight: 2.4,
              fillColor: "#78913D",
              fillOpacity: 0.88,
            };
          }

          if (feature.properties.kind === "path") {
            return {
              color: "#7B5CA5",
              weight: 2,
              dashArray: "5 5",
              fillColor: feature.properties.color || "#B8A1CF",
              fillOpacity: 0.32,
            };
          }

          return {
            color: "#542B7E",
            weight: 1.3,
            fillColor: feature.properties.color || "#B8A1CF",
            fillOpacity: 0.82,
          };
        }

        /* ===================================================
           ROOM LAYER
        =================================================== */

        const roomLayer = L.geoJSON(data, {
          pointToLayer: (feature) => {
            const [x, y, width, height] = feature.properties.bounds;

            return L.rectangle(
              [
                [FLOOR_HEIGHT - y - height, x],
                [FLOOR_HEIGHT - y, x + width],
              ],
              roomStyle(feature),
            );
          },

          onEachFeature: (feature, layer) => {
            const title = feature.properties.code
              ? `${feature.properties.code} — ${feature.properties.name}`
              : feature.properties.name;

            const description = feature.properties.description
              ? `<p>${feature.properties.description}</p>`
              : "";

            layer.bindPopup(`
                <h2>${title}</h2>

                <p>
                  📍 ${feature.properties.type || "Room"} ·
                  ${feature.properties.floor || "Ground Floor"}
                </p>

                ${description}
              `);

            layer.on("click", () => {
              roomLayer.resetStyle();

              layer.setStyle({
                color: "#2B490E",
                weight: 3,
                fillColor: "#E2C750",
                fillOpacity: 0.95,
              });

              map.fitBounds(layer.getBounds(), {
                padding: [60, 60],
                maxZoom: 0.1,
                animate: true,
              });
            });
          },
        }).addTo(map);

        roomLayerRef.current = roomLayer;
      })
      .catch((error) => {
        console.error("GROUND FLOOR MAP ERROR:", error);

        setRouteMessage("Map error: " + error.message);
      });

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      window.removeEventListener("resize", handleWindowResize);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();

        leafletMapRef.current = null;
      }

      roomLayerRef.current = null;

      routeLayerRef.current = null;
    };
  }, []);

  /* =========================================================
     NAVIGABLE ROOMS
  ========================================================= */

  const isNavigable = (room) => {
    return !["wall", "area", "path"].includes(room.properties.kind);
  };

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredRooms = rooms.filter(
    (room) =>
      searchTerm &&
      room.properties.kind !== "wall" &&
      `${room.properties.code || ""} ${room.properties.name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  /* =========================================================
     NAVIGATE BUTTON
  ========================================================= */

  function handleShowRoute() {
    if (!destination) {
      setRouteMessage("Choose a destination first.");

      return;
    }

    setRouteMessage("Route functionality is being connected next.");

    /*
     * Close the sidebar after navigation
     * is selected.
     */
    setSidebarOpen(false);

    /*
     * Give the map a moment to receive its
     * newly available screen space.
     */
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize({
          animate: true,
        });
      }
    }, 250);
  }

  /* =========================================================
     OPEN / CLOSE SIDEBAR
  ========================================================= */

  function toggleSidebar() {
    setSidebarOpen((previousState) => !previousState);

    /*
     * Tell Leaflet that its available space
     * will change.
     */
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize({
          animate: true,
        });
      }
    }, 300);
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="ground-floor-page">
      {/* =====================================================
          HAMBURGER BUTTON

          Visible when sidebar is closed.
      ===================================================== */}

      {!sidebarOpen && (
        <button
          className="ground-floor-menu-button"
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={
          sidebarOpen ? "ground-floor-sidebar open" : "ground-floor-sidebar"
        }
      >
        {/* SIDEBAR HEADER */}

        <div className="ground-floor-sidebar-header">
          <h1>Ground Floor</h1>

          <button
            className="ground-floor-close-button"
            onClick={toggleSidebar}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        {/* FIND ROOM */}

        <label>Find a room</label>

        <input
          type="search"
          placeholder="Search room..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        {searchTerm && (
          <div className="ground-floor-results">
            {filteredRooms.slice(0, 8).map((room) => (
              <button
                key={room.properties.id}
                onClick={() => {
                  setDestination(room.properties.id);

                  setSearchTerm("");
                }}
              >
                {room.properties.code ? `${room.properties.code} — ` : ""}
                {room.properties.name}
              </button>
            ))}
          </div>
        )}

        <hr />

        {/* START */}

        <label>Start from</label>

        <select
          value={start}
          onChange={(event) => setStart(event.target.value)}
        >
          <option value="entrance">Gate 1 / Entrance</option>

          {rooms.filter(isNavigable).map((room) => (
            <option key={room.properties.id} value={room.properties.id}>
              {room.properties.code ? `${room.properties.code} — ` : ""}
              {room.properties.name}
            </option>
          ))}
        </select>

        {/* DESTINATION */}

        <label>Go to</label>

        <select
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        >
          <option value="">Choose a room...</option>

          {rooms.filter(isNavigable).map((room) => (
            <option key={room.properties.id} value={room.properties.id}>
              {room.properties.code ? `${room.properties.code} — ` : ""}
              {room.properties.name}
            </option>
          ))}
        </select>

        {/* NAVIGATE */}

        <button className="show-route-button" onClick={handleShowRoute}>
          Navigate
        </button>

        {/* MESSAGE */}

        <p className="route-message">{routeMessage}</p>
      </aside>

      {/* =====================================================
          MAP

          The map fills the available screen.
          The sidebar is NOT inside the Leaflet map.
      ===================================================== */}

      <section className="ground-floor-map-section">
        <div ref={mapRef} id="ground-floor-map" className="ground-floor-map" />
      </section>
    </main>
  );
}

export default GroundFloorMap;
