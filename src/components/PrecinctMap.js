import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';

// Fix Leaflet icon issues
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const PrecinctMap = ({ currentBatch }) => {
  const [precinctBoundaries, setPrecinctBoundaries] = useState(null);
  const [precinctResults, setPrecinctResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('No debug info yet');

  // Function to transform California State Plane (EPSG:2230) to WGS84
  const transformCoordinates = (coordinates) => {
    // More accurate transformation for San Diego County (EPSG:2230 to WGS84)
    // These are specific to San Diego area in California State Plane Zone 6
    const x = coordinates[0];
    const y = coordinates[1];
    
    // Transform using these specific factors for San Diego (approximate)
    // These values were determined empirically for San Diego County
    const lon = (x - 6270000) * 0.00000306 - 117.15;
    const lat = (y - 1790000) * 0.00000326 + 32.71;
    
    return [lon, lat];
  };

  // Transform entire GeoJSON
  const transformGeoJSON = (geojson) => {
    return {
      ...geojson,
      features: geojson.features.map(feature => {
        const newFeature = { ...feature };
        
        if (newFeature.geometry && newFeature.geometry.type === 'Polygon') {
          newFeature.geometry = {
            ...newFeature.geometry,
            coordinates: newFeature.geometry.coordinates.map(ring => 
              ring.map(coord => transformCoordinates(coord))
            )
          };
        }
        
        return newFeature;
      })
    };
  };

  // Load precinct boundaries data
  useEffect(() => {
    const loadPrecinctBoundaries = async () => {
      try {
        setLoading(true);
        setDebugInfo('Fetching GeoJSON file...');
        
        // Fetch the precinct boundaries file
        const response = await fetch(`${process.env.PUBLIC_URL}/data/Election_Precincts_2025_04_08.geojson`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch precinct boundaries: ${response.status} ${response.statusText}`);
        }
        
        setDebugInfo('GeoJSON file fetched, parsing JSON...');
        const text = await response.text();
        
        // Check if we got any data
        if (!text || text.trim() === '') {
          throw new Error('Empty GeoJSON file');
        }
        
        try {
          const geojson = JSON.parse(text);
          
          // Check if it's a valid GeoJSON
          if (!geojson.type || !geojson.features) {
            setDebugInfo(`Invalid GeoJSON format. Missing type or features. Keys: ${Object.keys(geojson).join(', ')}`);
          } else {
            setDebugInfo(`Successfully parsed GeoJSON with ${geojson.features.length} features`);
            
            // Check for the CRS
            if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name === "EPSG:2230") {
              setDebugInfo(prevInfo => `${prevInfo}\nDetected EPSG:2230 (California State Plane) projection, transforming coordinates...`);
              
              // Transform the coordinates
              const transformedGeoJson = transformGeoJSON(geojson);
              setPrecinctBoundaries(transformedGeoJson);
              
              // Log a sample transformed coordinate
              if (transformedGeoJson.features.length > 0 && 
                  transformedGeoJson.features[0].geometry &&
                  transformedGeoJson.features[0].geometry.coordinates &&
                  transformedGeoJson.features[0].geometry.coordinates[0]) {
                  
                setDebugInfo(prevInfo => `${prevInfo}\nSample transformed coordinate: ${JSON.stringify(transformedGeoJson.features[0].geometry.coordinates[0][0])}`);
              }
            } else {
              // No specific CRS or already in WGS84
              setPrecinctBoundaries(geojson);
            }
          }
        } catch (jsonError) {
          setDebugInfo(`Failed to parse JSON: ${jsonError.message}`);
          throw jsonError;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading precinct boundaries:", err);
        setError(`Error loading precinct boundaries: ${err.message}`);
        setDebugInfo(prev => `${prev}\nERROR: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadPrecinctBoundaries();
  }, []);
  
  // Load precinct-level election results when currentBatch changes
  useEffect(() => {
    if (!currentBatch) return;
    
    const loadPrecinctResults = async () => {
      try {
        setDebugInfo(prev => `${prev}\nFetching precinct results...`);
        // Load precinct results file for the current batch
        const response = await fetch(`${process.env.PUBLIC_URL}/data/precincts_21.csv`);
        
        if (!response.ok) {
          setDebugInfo(prev => `${prev}\nPrecinct results not found: ${response.status}`);
          return;
        }
        
        const text = await response.text();
        setDebugInfo(prev => `${prev}\nReceived precinct results data, parsing CSV...`);
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setDebugInfo(prev => `${prev}\nParsed ${results.data.length} precinct results`);
            
            // Log a sample of the parsed data
            if (results.data.length > 0) {
              setDebugInfo(prev => `${prev}\nSample result: ${JSON.stringify(results.data[0])}`);
            }
            
            setPrecinctResults(results.data);
          },
          error: (error) => {
            setDebugInfo(prev => `${prev}\nError parsing CSV: ${error.message}`);
            setError(`Error parsing precinct results: ${error.message}`);
          }
        });
      } catch (err) {
        setDebugInfo(prev => `${prev}\nError loading results: ${err.message}`);
        console.error("Error loading precinct results:", err);
      }
    };
    
    loadPrecinctResults();
  }, [currentBatch]);

  // Function to style precincts based on results
  const getPrecinctStyle = (feature) => {
    // Default style when no results are available
    const defaultStyle = {
      fillColor: '#CCCCCC',
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.3
    };
    
    if (!precinctResults) return defaultStyle;
    
    // Match precinct with results
    const precinctId = feature.properties.consnum;
    
    // Log for debugging
    // console.log("Looking for precinct", precinctId, "in results");
    
    // Find this precinct in the results - try different matching strategies
    let precinctResult = precinctResults.find(result => 
      result.Precinct && String(result.Precinct) === String(precinctId)
    );
    
    // If not found, try other properties from the CSV
    if (!precinctResult) {
      precinctResult = precinctResults.find(result => {
        // Try all properties in the result that might match the precinct ID
        return Object.entries(result).some(([key, value]) => 
          String(value) === String(precinctId)
        );
      });
    }
    
    if (!precinctResult) return defaultStyle;
    
    // Determine which candidate has the most votes in this precinct
    const candidateColors = {
      'CAROLINA CHAVEZ': '#0000ff', // Blue
      'LOUIS A. FUENTES': '#ff0000', // Red
      'VIVIAN MORENO': '#008000', // Green
      'LINCOLN PICKARD': '#ffa500', // Orange
      'PALOMA AGUIRRE': '#800080', // Purple
      'ELIZABETH EFIRD': '#00ced1', // Dark Turquoise
      'JOHN MC CANN': '#ff69b4' // Hot Pink
    };
    
    // Find the candidate with the most votes
    let leadingCandidate = null;
    let maxVotes = 0;
    
    Object.entries(precinctResult).forEach(([key, value]) => {
      // Skip non-candidate fields - adjust based on your actual CSV structure
      if (['Precinct', 'PrecinctName', 'TotalVotes'].includes(key)) return;
      if (typeof value !== 'number') return; // Skip non-numeric values
      
      // Check if this candidate has more votes
      if (value > maxVotes) {
        maxVotes = value;
        leadingCandidate = key;
      }
    });
    
    const color = candidateColors[leadingCandidate] || '#CCCCCC';
    
    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.7
    };
  };
  
  // Add tooltips to each precinct
  const onEachPrecinct = (feature, layer) => {
    const precinctId = feature.properties.consnum;
    const precinctName = feature.properties.consname || 'Unknown';
    
    if (!precinctResults) {
      layer.bindTooltip(`
        <strong>Precinct: ${precinctName}</strong><br>
        No results available
      `);
      return;
    }
    
    // Find this precinct in the results - same matching logic as in getPrecinctStyle
    let precinctResult = precinctResults.find(result => 
      result.Precinct && String(result.Precinct) === String(precinctId)
    );
    
    // If not found, try other properties from the CSV
    if (!precinctResult) {
      precinctResult = precinctResults.find(result => {
        // Try all properties in the result that might match the precinct ID
        return Object.entries(result).some(([key, value]) => 
          String(value) === String(precinctId)
        );
      });
    }
    
    if (!precinctResult) {
      layer.bindTooltip(`
        <strong>Precinct: ${precinctName} (ID: ${precinctId})</strong><br>
        No results available for this precinct
      `);
      return;
    }
    
    // Format tooltip content
    let tooltipContent = `<strong>Precinct: ${precinctName}</strong><br>`;
    
    // Add Total Votes if available
    const totalVotes = precinctResult.TotalVotes || 
                      precinctResult['Total Votes'] || 
                      Object.values(precinctResult).reduce((sum, val) => 
                        typeof val === 'number' ? sum + val : sum, 0);
    
    tooltipContent += `Total Votes: ${totalVotes}<br><br>`;
    
    // Add results for each candidate
    Object.entries(precinctResult).forEach(([key, value]) => {
      // Skip non-candidate fields - adjust based on your actual CSV structure
      if (['Precinct', 'PrecinctName', 'TotalVotes', 'Total Votes'].includes(key)) return;
      if (typeof value !== 'number') return; // Skip non-numeric values
      
      // Calculate percentage
      const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
      
      tooltipContent += `${key}: ${value} (${percentage}%)<br>`;
    });
    
    layer.bindTooltip(tooltipContent, { sticky: true });
  };

  return (
    <div className="precinct-map">
      <h3>Precinct Results Map</h3>
      {loading ? (
        <div>Loading precinct map...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <>
          <div style={{ height: '500px', width: '100%', margin: '20px 0' }}>
            <MapContainer
              center={[32.71, -117.15]} // San Diego coordinates
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {precinctBoundaries && (
                <GeoJSON
                  data={precinctBoundaries}
                  style={getPrecinctStyle}
                  onEachFeature={onEachPrecinct}
                />
              )}
            </MapContainer>
          </div>
          <div style={{ whiteSpace: 'pre-line', fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
            Debug Info: {debugInfo}
          </div>
        </>
      )}
    </div>
  );
};

export default PrecinctMap;