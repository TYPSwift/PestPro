import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import './App.css';
import * as topojson from "topojson-client";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

function MapChart({ selectedCounty }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([0, 0]);
  const [geographies, setGeographies] = useState([]);

  useEffect(() => {
    fetch(geoUrl)
      .then((response) => response.json())
      .then((us) => {
        const geoJsonData = topojson.feature(us, us.objects.counties).features;
        setGeographies(geoJsonData);
      })
      .catch((error) => console.error("Error fetching geo data:", error));
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      const countyGeo = geographies.find(
        (geo) => geo.properties.name === selectedCounty
      );
      if (countyGeo) handleClick(countyGeo);
    }
  }, [selectedCounty, geographies]);

  const handleClick = (geo) => {
    // Ensure that there are valid coordinates to use
    if (geo.geometry && geo.geometry.coordinates && geo.geometry.coordinates[0] && geo.geometry.coordinates[0][0]) {
      const coordinates = geo.geometry.coordinates[0];
      const centroid = calculateCentroid(coordinates);
  
      // Only update center and zoom if a valid centroid is returned
      if (centroid) {
        setCenter(centroid);
        setZoom(4); // Set a fixed zoom level for counties
      } else {
        console.warn("Invalid centroid calculated, no zoom applied.");
      }
    } else {
      console.warn("No valid geometry coordinates available for this county, no zoom applied.");
    }
  };
  
  const calculateCentroid = (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
      return null; // Return null if no valid coordinates are available
    }
  
    // Filter to ensure valid coordinate pairs
    const validCoordinates = coordinates.filter(coord => coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1]));
    if (validCoordinates.length === 0) {
      return null; // Return null if no valid pairs are available
    }
  
    const xSum = validCoordinates.reduce((sum, coord) => sum + coord[0], 0);
    const ySum = validCoordinates.reduce((sum, coord) => sum + coord[1], 0);
  
    return [xSum / validCoordinates.length, ySum / validCoordinates.length];
  };
  
  

  const resetZoom = () => {
    setCenter([-96, 37.5]); // Reset to default center
    setZoom(3); // Reset to initial zoom level
  };

  return (
    <div className="map-container">
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: "75%", height: "75%", backgroundColor: "#e0f7e9" }}
      >
        <ZoomableGroup center={center} zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleClick(geo)}
                  style={{
                    default: {fill: geo.properties.name === selectedCounty ? "#FFD700" : "#66c0a1" // Highlight in gold if selected
                    },
                    hover: { fill: "#F53" },
                    pressed: { outline: "none" }
                  }}
                  stroke="#115859"
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

function ZipCodeInput({ onSelectCounty }) {
  const [zipCode, setZipCode] = useState('');
  const [zipData, setZipData] = useState([]);

  useEffect(() => {
    fetch('/zip_county_data.json')
      .then(response => response.json())
      .then(data => setZipData(data))
      .catch(error => console.error('Error loading zip data:', error));
  }, []);

  const getCountyFromZip = async (zip) => {
    const match = zipData.find(entry => entry.zip === parseInt(zip));
    return match ? match.county_name : null;
  };

  const handleChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    getCountyFromZip(zipCode).then(county => {
      if (county) {
        onSelectCounty(county); // Pass selected county to App
      } else {
        console.log('County not found.');
      }
    });
  };

  return (
    <div style={{ maxWidth: '300px', margin: '20px auto', textAlign: 'center' }}>
      <h2>Enter ZIP Code</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={zipCode}
          onChange={handleChange}
          placeholder="ZIP Code"
          maxLength="10"
          required
          style={{ padding: '10px', width: '100%' }}
        />
        <button type="submit" style={{ padding: '10px', marginTop: '10px', width: '100%' }}>
          Submit
        </button>
      </form>
    </div>
  );
}

function App() {
  const [selectedCounty, setSelectedCounty] = useState(null);

  return (
    <div className="App" style={{ backgroundColor: "#e0f7e9", height: "100vh" }}>
      <header className="App-header">
        <MapChart selectedCounty={selectedCounty} />
      </header>
      <Navigation />
      <ZipCodeInput onSelectCounty={setSelectedCounty} />
    </div>
  );
}

export default App;
