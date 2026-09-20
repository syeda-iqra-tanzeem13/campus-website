import { useState } from "react";
import groundFloorPlan from "../assets/ground_floor.svg";

function InteractiveFloorMap() {
  const [selectedRoom, setSelectedRoom] = useState(null);

  return (
    <div className="interactive-floor-map">
      <img
        src={groundFloorPlan}
        alt="UG Block ground floor plan"
        className="floor-plan-image"
      />

      {/* TEST CLICKABLE AREA */}
      <button
        className="room-hotspot test-room"
        onClick={() => setSelectedRoom("Test Room")}
        aria-label="Test Room"
      />

      {selectedRoom && (
        <div className="room-info-popup">
          <strong>{selectedRoom}</strong>
          <button onClick={() => setSelectedRoom(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default InteractiveFloorMap;
