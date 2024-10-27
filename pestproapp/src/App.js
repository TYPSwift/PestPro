import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import './App.css';
import * as topojson from "topojson-client";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

function MapChart({ selectedCounty, selectedState }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([0, 0]);
  const [geographies, setGeographies] = useState([]);

  useEffect(() => {
    fetch(geoUrl)
      .then((response) => response.json())
      .then((us) => {
        const counties = topojson.feature(us, us.objects.counties).features;
        const states = topojson.feature(us, us.objects.states).features;

        // Add state names to counties for matching
        const countiesWithStates = counties.map(county => {
          const state = states.find(state => state.id === county.id.slice(0, 2)); // FIPS code prefix match
          return {
            ...county,
            properties: {
              ...county.properties,
              state_name: state ? state.properties.name : null,
            }
          };
        });
        console.log("Geographies with state names:", countiesWithStates); // Log geographies to inspect

        setGeographies(countiesWithStates);
      })

      .catch((error) => console.error("Error fetching geo data:", error));
  }, []);

  useEffect(() => {
      console.log("Selected County and State for Highlighting:", selectedCounty, selectedState);

    if (selectedCounty && selectedState) {
      console.log("Selected County:", selectedCounty);
      console.log("Selected State:", selectedState);
      const matchingGeo = geographies.find(
        (geo) =>
          geo.properties.name === selectedCounty &&
          geo.properties.state_name === selectedState
      );
      if (matchingGeo) {
        console.log("Matching geography found:", matchingGeo);

        handleClick(matchingGeo);
      } else {
        console.warn(`No matching geography found for ${selectedCounty}, ${selectedState}`);
      }
    }
  }, [selectedCounty, selectedState, geographies]);

  const handleClick = (geo) => {
    if (geo.geometry && geo.geometry.coordinates) {
      const centroid = calculateCentroid(geo.geometry.coordinates[0]);
      if (centroid) {
        setCenter(centroid);
        setZoom(4);
      }
    }
  };

  const calculateCentroid = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return null;
    const validCoords = coordinates.filter(
      (coord) => coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])
    );
    if (validCoords.length === 0) return null;
    const xSum = validCoords.reduce((sum, coord) => sum + coord[0], 0);
    const ySum = validCoords.reduce((sum, coord) => sum + coord[1], 0);
    return [xSum / validCoords.length, ySum / validCoords.length];
  };

  return (
    <div className="map-container">
      <ComposableMap projection="geoAlbersUsa" style={{ width: "75%", height: "75%", backgroundColor: "#e0f7e9" }}>
        <ZoomableGroup center={center} zoom={zoom}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill:
                        geo.properties.name === selectedCounty 
                          ? "#FFD700"
                          : "#66c0a1"
                    },
                    hover: { fill: "#F53" },
                    pressed: { outline: "none" }
                  }}
                  stroke="#115859"
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
      <button className="nav-button"><img className="button-img" src='/bulb.png'/>Learn</button>
      <button className="nav-button"><img className="button-img" src='/nav4.png'/>Map</button>
      <button className="nav-button"><img className="button-img" src='/lens.png'/>Capture</button>
    </div>
  );
}

function ZipCodeInput({ onSelectCountyAndState }) {
  const [zipCode, setZipCode] = useState('');
  const [zipData, setZipData] = useState([]);

  useEffect(() => {
    console.log("Fetching ZIP data"); // Debugging: Check if fetch starts

    fetch('/zip_county_state_only_data.json')
      .then(response => response.json())
      .then(data => {console.log("ZIP data loaded:", data); // Debugging: Check if data loads correctly
        setZipData(data);})
      .catch(error => console.error('Error loading zip data:', error));
  }, []);

  const getCountyStateFromZip = async (zip) => {
    const match = zipData.find(entry => entry.zip === parseInt(zip, 10));
    if (match) {
      return { county: match.county_name, state: match.state_name };
    }
    return { county: null, state: null };
  };

  const handleChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("handleSubmit called"); // Debugging: Confirm form submit

    const { county, state } = await getCountyStateFromZip(zipCode);
    if (county && state) {
      console.log("Setting county and state:", county, state);  // Debugging log

      onSelectCountyAndState(county, state); // Pass selected county and state to App
    } else {
      console.log('County or state not found.');
    }
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
  const [selectedState, setSelectedState] = useState(null);

  const handleSelectCountyAndState = (county, state) => {
    setSelectedCounty(county);
    setSelectedState(state);
  };
  return (
    <div className="App" style={{ backgroundColor: "#e0f7e9", height: "100vh" }}>
      <header className="App-header">
        <MapChart selectedCounty={selectedCounty} selectedState={selectedState} />
      </header>
      <Navigation />
      <ZipCodeInput onSelectCountyAndState={handleSelectCountyAndState} />
    </div>
  );
}

export default App;
