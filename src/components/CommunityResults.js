import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const CommunityResults = ({ currentBatch }) => {
  const [communityResults, setCommunityResults] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communityList, setCommunityList] = useState([]);
  
  useEffect(() => {
    loadCommunityResults();
  }, [currentBatch]);
  
  const loadCommunityResults = async () => {
    if (!currentBatch) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load precinct results file for the current batch
      const response = await fetch(`${process.env.PUBLIC_URL}/data/precincts_21.csv`);
      
      if (!response.ok) {
        throw new Error("Failed to load precinct data");
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
          // Process the results to extract community data
          const resultRows = results.data.filter(row => row.Precinct && row['Candidate Name']);
          
          // Extract community names from precincts
          const communities = {};
          
          resultRows.forEach(row => {
            // Extract the community name from the precinct identifier
            const precinctParts = row.Precinct.split('-');
            if (precinctParts.length >= 3) {
              const communityName = precinctParts[2].trim();
              
              // Skip if we couldn't extract a community name
              if (!communityName) return;
              
              // Initialize the community if it doesn't exist
              if (!communities[communityName]) {
                communities[communityName] = {
                  name: communityName,
                  totalVotes: 0,
                  candidates: {}
                };
              }
              
              // Add this candidate's votes to the community
              const candidateName = row['Candidate Name'].trim();
              const votes = row.Votes || 0;
              
              if (!communities[communityName].candidates[candidateName]) {
                communities[communityName].candidates[candidateName] = 0;
              }
              
              communities[communityName].candidates[candidateName] += votes;
              communities[communityName].totalVotes += votes;
            }
          });
          
          // Convert communities object to an array for easier rendering
          const communityArray = Object.values(communities).map(community => {
            // Calculate percentages for each candidate
            const candidatesWithPercentages = Object.entries(community.candidates).map(([name, votes]) => {
              const percentage = community.totalVotes > 0 
                ? (votes / community.totalVotes * 100).toFixed(2) 
                : "0.00";
              
              return {
                name,
                votes,
                percentage
              };
            });
            
            // Sort candidates by votes (descending)
            candidatesWithPercentages.sort((a, b) => b.votes - a.votes);
            
            return {
              ...community,
              candidatesList: candidatesWithPercentages
            };
          });
          
          // Sort communities by name
          communityArray.sort((a, b) => a.name.localeCompare(b.name));
          
          // Get just the community names for the dropdown
          const communityNames = communityArray.map(c => c.name);
          
          setCommunityResults(communityArray);
          setCommunityList(communityNames);
          setSelectedCommunity(communityNames.length > 0 ? communityNames[0] : null);
          setLoading(false);
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(`Error loading community results: ${err.message}`);
      setLoading(false);
    }
  };
  
  return (
    <div className="community-results">
      <h3>Results by Community</h3>
      {loading ? (
        <div>Loading community results...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div>
          <div className="community-selector">
            <label htmlFor="community-select">Select Community: </label>
            <select 
              id="community-select"
              value={selectedCommunity || ''}
              onChange={(e) => setSelectedCommunity(e.target.value)}
            >
              {communityList.map(community => (
                <option key={community} value={community}>
                  {community}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCommunity && (
            <div className="community-detail">
              <h4>{selectedCommunity}</h4>
              <table className="community-results-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Votes</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {communityResults
                    .find(c => c.name === selectedCommunity)?.candidatesList
                    .map((candidate, index) => (
                      <tr key={index} className={index === 0 ? 'leader' : ''}>
                        <td>{candidate.name}</td>
                        <td>{new Intl.NumberFormat().format(candidate.votes)}</td>
                        <td>{candidate.percentage}%</td>
                      </tr>
                    ))
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td>
                      <strong>
                        {new Intl.NumberFormat().format(
                          communityResults.find(c => c.name === selectedCommunity)?.totalVotes || 0
                        )}
                      </strong>
                    </td>
                    <td>100.00%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityResults;