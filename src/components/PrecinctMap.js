import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import proj4 from 'proj4';

// Fix Leaflet icon issues
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const PrecinctMap = ({ metadata, currentBatch }) => {
  const [precinctBoundaries, setPrecinctBoundaries] = useState(null);
  const [precinctResults, setPrecinctResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the projection transformations
  const transformCoordinates = (coordinates) => {
    // Define the projections
    // EPSG:2230 is the California State Plane Zone 6 projection (San Diego)
    proj4.defs('EPSG:2230', '+proj=lcc +lat_1=32.78333333333333 +lat_2=33.88333333333333 +lat_0=32.16666666666666 +lon_0=-116.25 +x_0=2000000 +y_0=500000 +ellps=GRS80 +datum=NAD83 +units=us-ft +no_defs');
    
    // Transform from California State Plane to WGS84
    const result = proj4('EPSG:2230', 'WGS84', coordinates);
    
    // Return [longitude, latitude] which is what Leaflet expects
    return result;
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
    if (!metadata || !metadata.precinctsGeojson) return;

    const loadPrecinctBoundaries = async () => {
      try {
        setLoading(true);
        
        // Fetch the precinct boundaries file
        const response = await fetch(`${process.env.PUBLIC_URL}/data/${metadata.precinctsGeojson}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch precinct boundaries: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        
        // Check if we got any data
        if (!text || text.trim() === '') {
          throw new Error('Empty GeoJSON file');
        }
        
        try {
          const geojson = JSON.parse(text);
          
          // Check if it's a valid GeoJSON
          if (!geojson.type || !geojson.features) {
            throw new Error('Invalid GeoJSON format. Missing type or features.');
          }
            
          // Check for the CRS
          if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name === "EPSG:2230") {
            // Transform the coordinates
            const transformedGeoJson = transformGeoJSON(geojson);
            setPrecinctBoundaries(transformedGeoJson);
          } else {
            // No specific CRS or already in WGS84
            setPrecinctBoundaries(geojson);
          }
        } catch (jsonError) {
          throw jsonError;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading precinct boundaries:", err);
        setError(`Error loading precinct boundaries: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadPrecinctBoundaries();
  }, [metadata]);
  
  // Load precinct-level election results when currentBatch changes
  useEffect(() => {
    if (!currentBatch || !metadata || !metadata.precinctsResults) {
      setPrecinctResults(null); // Reset results if no batch or metadata
      return;
    }
    
    const loadPrecinctResults = async () => {
      try {
        // Load precinct results file for the current batch
        const response = await fetch(`${process.env.PUBLIC_URL}/data/${metadata.precinctsResults}`);
        
        if (!response.ok) {
          console.log("Precinct results not found, showing map without results.");
          setPrecinctResults(null);
          return;
        }
        
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          // Skip the first two rows which contain irrelevant text
          beforeFirstChunk: function(chunk) {
            const rows = chunk.split(/\r\n|\r|\n/);
            if (rows.length > 2) {
              return rows.slice(2).join('\n');
            }
            return chunk;
          },
          complete: (results) => {
            // Process the results to extract the precinct numbers
            const rawRows = results.data.filter(row => row.Precinct && row['Candidate Name']);
            console.log("Raw CSV rows:", rawRows.length);
            
            // Group by precinct
            const precinctGroups = {};
            
            rawRows.forEach(row => {
              // Extract the precinct number
              const parts = row.Precinct.split('-');
              let precinctNumber = '';
              if (parts.length >= 2) {
                precinctNumber = parts[1].trim();
              }
              
              // Skip if we couldn't extract a precinct number
              if (!precinctNumber) return;
              
              // Initialize the group if it doesn't exist
              if (!precinctGroups[precinctNumber]) {
                precinctGroups[precinctNumber] = {
                  Precinct: row.Precinct,
                  PrecinctNumber: precinctNumber,
                  TotalVotes: 0,
                  candidates: {}
                };
              }
              
              // Add this candidate's votes to the precinct group
              const candidateName = row['Candidate Name'].trim();
              const votes = row.Votes || 0;
              
              precinctGroups[precinctNumber].candidates[candidateName] = votes;
              precinctGroups[precinctNumber].TotalVotes += votes;
            });
            
            // Convert groups to an array of results
            const processedResults = Object.values(precinctGroups).map(group => {
              // Create a result object with precinct info
              const result = {
                Precinct: group.Precinct,
                PrecinctNumber: group.PrecinctNumber,
                TotalVotes: group.TotalVotes
              };
              
              // Add each candidate's votes as a direct property
              Object.entries(group.candidates).forEach(([candidate, votes]) => {
                result[candidate] = votes;
              });
              
              return result;
            });
            
            console.log("Processed precinct results:", processedResults.length);
            if (processedResults.length > 0) {
              console.log("Sample processed result:", processedResults[0]);
            }
            
            setPrecinctResults(processedResults);
          },
          error: (error) => {
            console.error(`Error parsing CSV: ${error.message}`);
          }
        });
      } catch (err) {
        console.error("Error loading precinct results:", err);
      }
    };
    
    loadPrecinctResults();
  }, [metadata, currentBatch]);

  // Function to style precincts based on results
  const getPrecinctStyle = (feature) => {
    // Default style when no results are available
    const defaultStyle = {
      fillColor: '#EEEEEE',
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.3
    };
    
    if (!precinctResults || precinctResults.length === 0) return defaultStyle;
    
    // Match precinct with results
    const precinctId = feature.properties.consnum;
    
    // Find this precinct in the results
    let precinctResult = precinctResults.find(result => 
      result.PrecinctNumber && String(result.PrecinctNumber) === String(precinctId)
    );
    
    // If no match found, use a distinctive style to show it's unmapped
    if (!precinctResult) {
      return {
        fillColor: '#DDDDDD',  // Light gray
        weight: 1,
        opacity: 1,
        color: '#999',         // Darker border
        fillOpacity: 0.2       // More transparent
      };
    }
    
    const candidateColors = {};
    if (metadata && metadata.candidates) {
      metadata.candidates.forEach(c => {
        candidateColors[c.name] = c.color;
      });
    }
    
    // Find the candidate with the most votes
    let leadingCandidate = null;
    let maxVotes = 0;
    
    const candidateNames = (metadata && metadata.candidates) ? metadata.candidates.map(c => c.name) : [];
    
    // Check each candidate for votes
    candidateNames.forEach(candidate => {
      const votes = precinctResult[candidate] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        leadingCandidate = candidate;
      }
    });
    
    // If no votes counted yet, use a special style
    if (maxVotes === 0) {
      return {
        fillColor: '#CCFFCC',  // Light green
        weight: 1,
        opacity: 1,
        color: '#666',
        fillOpacity: 0.5
      };
    }
    
    // Use the color for the leading candidate
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
        Waiting for results data...
      `);
      return;
    }
    
    // Find this precinct in the results
    let precinctResult = precinctResults.find(result => 
      result.PrecinctNumber && String(result.PrecinctNumber) === String(precinctId)
    );
    
    if (!precinctResult) {
      layer.bindTooltip(`
        <strong>Precinct: ${precinctName} (ID: ${precinctId})</strong><br>
        No results found for this precinct
      `);
      return;
    }
    
    // Format tooltip content
    let tooltipContent = `<strong>Precinct: ${precinctName}</strong><br>`;
    
    // Add Total Votes
    tooltipContent += `Total Votes: ${precinctResult.TotalVotes || 0}<br><br>`;
    
    const candidateNames = (metadata && metadata.candidates) ? metadata.candidates.map(c => c.name) : [];
    
    // Create an array of candidates with their votes for sorting
    const candidateResults = candidateNames.map(candidate => {
      return {
        name: candidate,
        votes: precinctResult[candidate] || 0
      };
    });
    
    // Sort candidates by vote count (descending)
    candidateResults.sort((a, b) => b.votes - a.votes);
    
    // Add each candidate with their votes in sorted order
    candidateResults.forEach(candidate => {
      const percentage = precinctResult.TotalVotes > 0 
        ? ((candidate.votes / precinctResult.TotalVotes) * 100).toFixed(1) 
        : '0.0';
      
      tooltipContent += `${candidate.name}: ${candidate.votes} (${percentage}%)<br>`;
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
              center={[32.65, -117.1]} // San Diego District 1 coordinates
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
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
          
          {/* Map Legend */}
          <div className="map-legend" style={{ 
            marginTop: '10px', 
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Candidate Colors</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {metadata && metadata.candidates && metadata.candidates.map((candidate, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  marginRight: '10px'
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: candidate.color,
                    marginRight: '5px',
                    border: '1px solid #666'
                  }}></div>
                  <span>{candidate.name}</span>
                </div>
              ))}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                marginRight: '10px'
              }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: '#CCFFCC',
                  marginRight: '5px',
                  border: '1px solid #666'
                }}></div>
                <span>No Votes</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: '#DDDDDD',
                  marginRight: '5px',
                  border: '1px solid #666'
                }}></div>
                <span>No Data</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrecinctMap;