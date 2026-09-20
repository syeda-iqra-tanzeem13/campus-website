import { useState } from "react";

import campusMap from "./assets/campus-map.jpg";
import collegeLogo from "./assets/st_anns_guide_logo.svg";

import secondFloorPlan from "./assets/2_floor.svg";
import thirdFloorPlan from "./assets/3_floor.svg";

import GroundFloorMap from "./GroundFloorMap";

const locations = [
  {
    name: "Room 101",
    type: "Classroom",
    floor: "1st Floor",
  },
  {
    name: "Room 102",
    type: "Classroom",
    floor: "1st Floor",
  },
  {
    name: "Room 201",
    type: "Classroom",
    floor: "2nd Floor",
  },
  {
    name: "Library",
    type: "Library",
    floor: "Ground Floor",
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const [selectedFloor, setSelectedFloor] = useState("first");

  const [pageHistory, setPageHistory] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  function navigateTo(nextPage) {
    setPageHistory((previousHistory) => [...previousHistory, currentPage]);

    setCurrentPage(nextPage);
  }

  function goBack() {
    const previousPage = pageHistory[pageHistory.length - 1];

    if (!previousPage) {
      return;
    }

    setCurrentPage(previousPage);

    setPageHistory((previousHistory) => previousHistory.slice(0, -1));
  }

  function Navbar() {
    return (
      <header className="navbar">
        {currentPage !== "home" && (
          <button className="navbar-back" onClick={goBack} aria-label="Go back">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M11 18L5 12L11 6" />
            </svg>
          </button>
        )}

        <span className="navbar-title">Smart Campus Navigation</span>
      </header>
    );
  }

  /* =========================================================
     UG DASHBOARD
  ========================================================= */

  if (currentPage === "dashboard") {
    const floorLabels = {
      gf: "Ground Floor",
      first: "1st Floor",
      second: "2nd Floor",
      third: "3rd Floor",
    };

    const matchingLocations =
      searchTerm.trim() === ""
        ? []
        : locations.filter((location) => {
            const query = searchTerm.toLowerCase();

            return (
              location.name.toLowerCase().includes(query) ||
              location.type.toLowerCase().includes(query) ||
              location.floor.toLowerCase().includes(query)
            );
          });

    return (
      <>
        <Navbar />

        <main className="ug-dashboard-page">
          <section className="ug-dashboard-content">
            {/* SEARCH */}
            <div className="dashboard-location-search">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search locations..."
                aria-label="Search locations"
              />

              {matchingLocations.length > 0 && (
                <div className="dashboard-location-suggestions">
                  {matchingLocations.map((location) => (
                    <div
                      className="dashboard-location-suggestion"
                      key={location.name}
                    >
                      {location.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOCK NAME */}
            <p className="ug-dashboard-block-name">UG BLOCK</p>

            {/* FLOOR TITLE */}
            <h1>{floorLabels[selectedFloor]}</h1>

            {/* =================================================
                FLOOR MAP
            ================================================= */}

            <section className="floor-plan-card">
              {selectedFloor === "gf" && <GroundFloorMap />}

              {selectedFloor === "second" && (
                <img
                  src={secondFloorPlan}
                  alt="UG Block second floor plan"
                  className="floor-plan-image"
                />
              )}

              {selectedFloor === "third" && (
                <img
                  src={thirdFloorPlan}
                  alt="UG Block third floor plan"
                  className="floor-plan-image"
                />
              )}
            </section>

            {/* =================================================
                FLOOR SELECTION
            ================================================= */}

            <section className="ug-floor-selection">
              <h2>Select Floor</h2>

              <div className="ug-floor-buttons">
                <button
                  className={
                    selectedFloor === "gf"
                      ? "ug-floor-button selected"
                      : "ug-floor-button"
                  }
                  onClick={() => setSelectedFloor("gf")}
                >
                  GF
                </button>

                <button
                  className={
                    selectedFloor === "first"
                      ? "ug-floor-button selected"
                      : "ug-floor-button"
                  }
                  onClick={() => setSelectedFloor("first")}
                >
                  1st
                </button>

                <button
                  className={
                    selectedFloor === "second"
                      ? "ug-floor-button selected"
                      : "ug-floor-button"
                  }
                  onClick={() => setSelectedFloor("second")}
                >
                  2nd
                </button>

                <button
                  className={
                    selectedFloor === "third"
                      ? "ug-floor-button selected"
                      : "ug-floor-button"
                  }
                  onClick={() => setSelectedFloor("third")}
                >
                  3rd
                </button>
              </div>
            </section>
          </section>
        </main>
      </>
    );
  }

  /* =========================================================
     CAMPUS MAP
  ========================================================= */

  if (currentPage === "campus-map") {
    return (
      <>
        <Navbar />

        <main className="campus-map-page">
          <p className="college-name">St. Ann's College for Women</p>

          <section className="campus-map-content">
            <h1>Campus Map</h1>

            <p className="page-description">
              Tap the Undergraduate Block to choose a floor.
            </p>

            <div className="map-container">
              <img
                src={campusMap}
                alt="St. Ann's College campus map"
                className="campus-map-image"
              />

              <button
                className="ug-map-hotspot"
                onClick={() => navigateTo("dashboard")}
                aria-label="Open UG Block"
              ></button>
            </div>
          </section>
        </main>
      </>
    );
  }

  /* =========================================================
     HOME
  ========================================================= */

  return (
    <>
      <Navbar />

      <main className="home-page minimal-home-page">
        <section className="minimal-home-content">
          <img
            src={collegeLogo}
            alt="St. Ann's College for Women logo"
            className="minimal-home-logo"
          />

          <button
            className="start-navigation-button"
            onClick={() => navigateTo("campus-map")}
          >
            Start Navigation
          </button>
        </section>
      </main>
    </>
  );
}

export default App;
