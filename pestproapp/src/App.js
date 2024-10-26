import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import './App.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

function MapChart() {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([0, 0]);

  const calculateCenter = (geo) => {
    const { geometry } = geo;
    if (geometry && geometry.coordinates) {
      let totalX = 0, totalY = 0;
      let count = 0;
  
      // Loop through all coordinate points to calculate their average
      geometry.coordinates.forEach((polygon) => {
        polygon[0].forEach(([x, y]) => {
          totalX += x;
          totalY += y;
          count += 1;
        });
      });
  
      // Average of all points to approximate center
      return [totalX / count, totalY / count];
    }
    return [0, 0];
  };

  // Function to handle clicks, using bounding box to determine center
  const handleClick = (geo) => {
    const newCenter = calculateCenter(geo);
    setCenter(newCenter);
    setZoom(4); // Zoom in level
  };
  return (
   <div className="map-container">

    <ComposableMap
      projection="geoAlbersUsa"
      style={{width:"75%", height:"75%", backgroundColor: "#e0f7e9" }} // Light green background for the map area
    >
    <ZoomableGroup center={center} zoom={zoom}>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onClick={() => handleClick(geo)}
              style={{default: {fill: "#66c0a1"},
              hover: {fill: "#F53"},
              pressed: { outline: "none" }
              }}
              // Single green shade for all geographies
              stroke="#115859" // Darker green for borders
              tabIndex={-1}
            />
          ))
        }
      </Geographies>
      </ZoomableGroup>  
    </ComposableMap>
    </div>
  );
}
function Navigation() {
  return (
    <div className="nav-bar">
      <button className="nav-button">Learn</button>
      <button className="nav-button">Map</button>
      <button className="nav-button">Capture</button>
    </div>
  );
}
function App() {
  return (
    <div className="App" style={{ backgroundColor: "#e0f7e9", height: "100vh" }}>
      <header className="App-header">
        <MapChart />
      </header>
      <div>
        <Navigation />
      </div>
    </div>
  );
}

export default App;
