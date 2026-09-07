import { useEffect, useState } from "react";
import Papa from "papaparse";
import campusMap from "./assets/campus-map.jpg";
import collegeLogo from "./assets/st_anns_guide_logo.svg";
import groundFloorPlan from "./assets/ground_floor.svg";
import firstFloorPlan from "./assets/1_floor.svg";
import secondFloorPlan from "./assets/2_floor.svg";
import thirdFloorPlan from "./assets/3_floor.svg";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
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
            <p className="ug-dashboard-block-name">UG BLOCK</p>
            <h1>{floorLabels[selectedFloor]}</h1>
            <section className="floor-plan-card">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={4}
                centerOnInit={true}
                wheel={{
                  step: 0.15,
                }}
                pinch={{
                  step: 5,
                }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="floor-plan-controls">
                      <button onClick={() => zoomIn()}>+</button>
                      <button onClick={() => zoomOut()}>−</button>
                      <button onClick={() => resetTransform()}>Reset</button>
                    </div>
                    <TransformComponent
                      wrapperClass="floor-plan-zoom-wrapper"
                      contentClass="floor-plan-zoom-content"
                    >
                      {selectedFloor === "gf" && (
                        <img
                          src={groundFloorPlan}
                          alt="UG Block ground floor plan"
                          className="floor-plan-image"
                        />
                      )}
                      {selectedFloor === "first" && (
                        <img
                          src={firstFloorPlan}
                          alt="UG Block first floor plan"
                          className="floor-plan-image"
                        />
                      )}
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
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </section>
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
                  aria-pressed={selectedFloor === "gf"}
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
                  aria-pressed={selectedFloor === "first"}
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
                  aria-pressed={selectedFloor === "second"}
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
                  aria-pressed={selectedFloor === "third"}
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
                alt="St. Ann's College for Women campus ground floor map"
                className="campus-map-image"
              />
              <button
                className="ug-map-hotspot"
                onClick={() => navigateTo("dashboard")}
                aria-label="Open UG dashboard"
              ></button>
            </div>
          </section>
        </main>
      </>
    );
  }
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
