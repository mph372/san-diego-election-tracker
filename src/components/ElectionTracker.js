import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ResultsTable from './ResultsTable';
import ResultsChart from './ResultsChart';
import MetadataDisplay from './MetadataDisplay';
import PrecinctMap from './PrecinctMap';
import CommunityResults from './CommunityResults';


const ElectionTracker = () => {
  const [metadata, setMetadata] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [electionResults, setElectionResults] = useState([]);
  const [previousResults, setPreviousResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchesHistory, setBatchesHistory] = useState({});

  // Function to load data for all batches
  const loadAllBatchData = async (updates) => {
    try {
      // Create an array of promises for fetching all batch data
      const fetchPromises = updates.map(update => 
        fetch(`${process.env.PUBLIC_URL}/data/${update.filename}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch batch ${update.batchNumber}`);
            }
            return response.text();
          })
          .then(csvText => {
            return new Promise((resolve) => {
              Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                  const batchData = results.data.filter(item => item['Candidate Name']);
                  resolve({ batchNumber: update.batchNumber, data: batchData });
                },
                error: (error) => {
                  console.error(`Error parsing batch ${update.batchNumber}: ${error.message}`);
                  resolve({ batchNumber: update.batchNumber, data: [] });
                }
              });
            });
          })
      );
      
      // Wait for all fetch operations to complete
      const batchResults = await Promise.all(fetchPromises);
      
      // Update the batches history with all results
      const newBatchesHistory = {};
      batchResults.forEach(result => {
        newBatchesHistory[result.batchNumber] = result.data;
      });
      
      return newBatchesHistory;
    } catch (err) {
      setError(`Error loading batch data: ${err.message}`);
      return {};
    }
  };

  useEffect(() => {
    // Fetch the metadata file
    fetch(`${process.env.PUBLIC_URL}/data/metadata.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }
        return response.json();
      })
      .then(async data => {
        setMetadata(data);
        
        // Get the most recent update if it exists
        if (data.updates && data.updates.length > 0) {
          const latestUpdate = data.updates[data.updates.length - 1];
          setCurrentBatch(latestUpdate);
          
          // Load all batch data
          const allBatchData = await loadAllBatchData(data.updates);
          setBatchesHistory(allBatchData);
          
          // Set the election results to the latest batch
          if (allBatchData[latestUpdate.batchNumber]) {
            setElectionResults(allBatchData[latestUpdate.batchNumber]);
          }
          
          setLoading(false);
        } else {
          // No updates available, so just stop loading and show the default message
          setLoading(false);
        }
      })
      .catch(err => {
        setError(`Error: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // Function to load a specific batch
  const loadBatch = (batchNumber) => {
    if (!metadata || !metadata.updates) return;
    
    setLoading(true);
    const selectedBatch = metadata.updates.find(update => update.batchNumber === parseInt(batchNumber));
    
    if (selectedBatch) {
      // Store current results as previous before updating
      if (currentBatch && currentBatch.batchNumber !== selectedBatch.batchNumber) {
        setPreviousResults(electionResults);
      }
      
      setCurrentBatch(selectedBatch);
      
      // Use the preloaded batch data
      if (batchesHistory[selectedBatch.batchNumber]) {
        setElectionResults(batchesHistory[selectedBatch.batchNumber]);
        setLoading(false);
      } else {
        // As a fallback, fetch the batch data if it's not in history
        fetch(`${process.env.PUBLIC_URL}/data/${selectedBatch.filename}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch batch ${selectedBatch.batchNumber}`);
            }
            return response.text();
          })
          .then(csvText => {
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              complete: (results) => {
                const newResults = results.data.filter(item => item['Candidate Name']);
                setElectionResults(newResults);
                
                // Store this batch in history
                setBatchesHistory(prev => ({
                  ...prev,
                  [selectedBatch.batchNumber]: newResults
                }));
                
                setLoading(false);
              },
              error: (error) => {
                setError(`CSV parsing error: ${error.message}`);
                setLoading(false);
              }
            });
          })
          .catch(err => {
            setError(`Error: ${err.message}`);
            setLoading(false);
          });
      }
    }
  };

  // Find previous batch data for comparison
  useEffect(() => {
    // Only try to find previous batch if we have metadata, current batch, and more than one batch
    if (metadata && metadata.updates && metadata.updates.length > 1 && currentBatch) {
      const currentIndex = metadata.updates.findIndex(update => 
        update.batchNumber === (typeof currentBatch.batchNumber === 'number' ? 
          currentBatch.batchNumber : parseInt(currentBatch.batchNumber))
      );
      
      // If there's a previous batch
      if (currentIndex > 0) {
        const previousBatch = metadata.updates[currentIndex - 1];
        
        // Check if we have it in history
        if (batchesHistory[previousBatch.batchNumber]) {
          setPreviousResults(batchesHistory[previousBatch.batchNumber]);
        }
      } else {
        // No previous batch
        setPreviousResults(null);
      }
    } else {
      // No metadata or only one batch
      setPreviousResults(null);
    }
  }, [currentBatch, metadata, batchesHistory]);

  if (loading) {
    return <div>Loading election data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="election-tracker">
      <h2>Election Results Tracker</h2>
      
      {metadata && metadata.updates && metadata.updates.length > 0 && (
        <div className="batch-selector">
          <h3>Select Update Batch:</h3>
          <select 
            value={currentBatch?.batchNumber} 
            onChange={(e) => loadBatch(e.target.value)}
          >
            {metadata.updates.map(update => (
              <option key={update.batchNumber} value={update.batchNumber}>
                Batch {update.batchNumber} - {new Date(update.timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {currentBatch && <MetadataDisplay metadata={currentBatch} />}
      
      {electionResults.length > 0 ? (
        <>
          <ResultsTable 
            results={electionResults} 
            previousResults={previousResults}
          />
          <ResultsChart 
            results={electionResults}
            metadata={metadata}
            batchesHistory={batchesHistory} 
          />
        </>
      ) : (
        <p>No election results available yet.</p>
      )}
      
      <PrecinctMap metadata={metadata} currentBatch={currentBatch} />
      <CommunityResults metadata={metadata} currentBatch={currentBatch} />
    </div>
  );
};

export default ElectionTracker;