import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ResultsTable from './ResultsTable';
import ResultsChart from './ResultsChart';
import MetadataDisplay from './MetadataDisplay';

const ElectionTracker = () => {
  const [metadata, setMetadata] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [electionResults, setElectionResults] = useState([]);
  const [previousResults, setPreviousResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchesHistory, setBatchesHistory] = useState({});

  useEffect(() => {
    // Fetch the metadata file
    fetch('/data/metadata.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }
        return response.json();
      })
      .then(data => {
        setMetadata(data);
        // Get the most recent update
        const latestUpdate = data.updates[data.updates.length - 1];
        setCurrentBatch(latestUpdate);
        
        // Fetch the CSV file for the latest update
        return fetch(`/data/${latestUpdate.filename}`);
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data');
        }
        return response.text();
      })
      .then(csvText => {
        // Parse the CSV data
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const currentResults = results.data.filter(item => item['Candidate Name']); // Filter out empty rows
            setElectionResults(currentResults);
            
            // Store this batch in history
            setBatchesHistory(prev => ({
              ...prev,
              [currentBatch.batchNumber]: currentResults
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
  }, []);

  // Function to load a specific batch
  const loadBatch = (batchNumber) => {
    setLoading(true);
    const selectedBatch = metadata.updates.find(update => update.batchNumber === batchNumber);
    
    if (selectedBatch) {
      // Store current results as previous before updating
      if (currentBatch && currentBatch.batchNumber !== batchNumber) {
        setPreviousResults(electionResults);
      }
      
      setCurrentBatch(selectedBatch);
      
      // Check if we already have this batch in our history
      if (batchesHistory[batchNumber]) {
        setElectionResults(batchesHistory[batchNumber]);
        setLoading(false);
        return;
      }
      
      // Fetch the CSV if we don't have it in history
      fetch(`/data/${selectedBatch.filename}`)
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
              const newResults = results.data.filter(item => item['Candidate Name']); // Filter out empty rows
              setElectionResults(newResults);
              
              // Store this batch in history
              setBatchesHistory(prev => ({
                ...prev,
                [batchNumber]: newResults
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
  };

  // Find previous batch data for comparison
  useEffect(() => {
    if (metadata && currentBatch) {
      const currentIndex = metadata.updates.findIndex(update => update.batchNumber === currentBatch.batchNumber);
      
      // If there's a previous batch
      if (currentIndex > 0) {
        const previousBatch = metadata.updates[currentIndex - 1];
        
        // Check if we have it in history
        if (batchesHistory[previousBatch.batchNumber]) {
          setPreviousResults(batchesHistory[previousBatch.batchNumber]);
        } else {
          // Fetch it if not in history
          fetch(`/data/${previousBatch.filename}`)
            .then(response => response.text())
            .then(csvText => {
              Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                  const prevResults = results.data.filter(item => item['Candidate Name']);
                  setPreviousResults(prevResults);
                  
                  // Store in history
                  setBatchesHistory(prev => ({
                    ...prev,
                    [previousBatch.batchNumber]: prevResults
                  }));
                }
              });
            })
            .catch(err => {
              console.error("Error fetching previous batch:", err);
              setPreviousResults(null);
            });
        }
      } else {
        // No previous batch
        setPreviousResults(null);
      }
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
      
      {metadata && (
        <div className="batch-selector">
          <h3>Select Update Batch:</h3>
          <select 
            value={currentBatch?.batchNumber} 
            onChange={(e) => loadBatch(parseInt(e.target.value))}
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
      
      {electionResults.length > 0 && (
        <>
          <ResultsTable 
            results={electionResults} 
            previousResults={previousResults} 
          />
          <ResultsChart results={electionResults} />
        </>
      )}
    </div>
  );
};

export default ElectionTracker;