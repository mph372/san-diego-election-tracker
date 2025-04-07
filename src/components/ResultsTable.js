import React from 'react';

// This component displays election results in a table with vote percentages and percentage changes
const ResultsTable = ({ results, previousResults }) => {
  // Check if results array is empty
  if (!results || results.length === 0) {
    return <p>No election results available.</p>;
  }

  // Get the contest name from the first result (they should all be the same)
  const contestName = results[0]['Contest Name'];
  
  // Define columns we want to display (excluding the ones you specified)
  const columnsToDisplay = Object.keys(results[0])
    .filter(column => 
      column !== 'Contest Name' && 
      column !== 'Party' && 
      column !== 'Number Of Precincts' && 
      column !== 'Precincts Reported' && 
      column !== 'Ballots Cast'
    );

  // Sort results by vote count (descending)
  const sortedResults = [...results].sort((a, b) => {
    return (b['Total Votes'] || 0) - (a['Total Votes'] || 0);
  });
  
  // Find the leader (candidate with most votes)
  const leader = sortedResults.length > 0 ? sortedResults[0] : null;

  // Calculate total votes across all candidates
  const totalAllVotes = sortedResults.reduce((sum, candidate) => sum + (candidate['Total Votes'] || 0), 0);

  // Function to format numbers with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="results-table">
      <h3>{contestName}</h3>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {columnsToDisplay.map(column => (
                <th key={column}>{formatColumnName(column)}</th>
              ))}
              <th>Percentage</th>
              {previousResults && <th>Vote Change</th>}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((row, index) => {
              // Find this candidate in the previous results if available
              const previousRow = previousResults ? 
                previousResults.find(prev => prev['Candidate Name'] === row['Candidate Name']) : 
                null;
              
              // Calculate vote change if previous results available
              const voteChange = previousRow && previousRow['Total Votes'] !== undefined && row['Total Votes'] !== undefined ? 
                row['Total Votes'] - previousRow['Total Votes'] : 
                null;
              
              // Calculate gap from leader
              const gapFromLeader = leader && row['Total Votes'] !== undefined ? 
                leader['Total Votes'] - row['Total Votes'] : 
                null;
              
              // Calculate vote percentage
              const votePercentage = totalAllVotes > 0 && row['Total Votes'] !== undefined ? 
                (row['Total Votes'] / totalAllVotes) * 100 : 
                0;
              
              // Calculate percentage change
              let prevPercentage = 0;
              if (previousRow && previousResults) {
                // Calculate total votes in previous batch
                const prevTotalAllVotes = previousResults.reduce(
                  (sum, candidate) => sum + (candidate['Total Votes'] || 0), 0
                );
                prevPercentage = prevTotalAllVotes > 0 ? 
                  (previousRow['Total Votes'] / prevTotalAllVotes) * 100 : 
                  0;
              }
              const percentageChange = previousRow ? votePercentage - prevPercentage : null;
              
              // Determine if this row is the leader
              const isLeader = index === 0;
              
              return (
                <tr key={index} className={isLeader ? 'leader' : ''}>
                  {columnsToDisplay.map(column => (
                    <td key={`${index}-${column}`}>
                      {column === 'Candidate Name' ? row[column] : 
                        (row[column] !== undefined ? formatNumber(row[column]) : 'N/A')}
                      
                      {/* Show gap from leader for Total Votes column (except for the leader) */}
                      {column === 'Total Votes' && !isLeader && gapFromLeader !== null && gapFromLeader > 0 && (
                        <span className="vote-gap">
                          ({formatNumber(gapFromLeader)} behind leader)
                        </span>
                      )}
                    </td>
                  ))}
                  
                  {/* Show vote percentage */}
                  <td>{votePercentage.toFixed(2)}%</td>
                  
                  {/* Show vote changes if previous results available */}
                  {previousResults && (
                    <td>
                      {voteChange !== null && (
                        <span className={`vote-change ${voteChange > 0 ? 'positive' : voteChange < 0 ? 'negative' : 'unchanged'}`}>
                          {voteChange > 0 ? `+${formatNumber(voteChange)}` : formatNumber(voteChange)}
                          {percentageChange !== null && (
                            <span className="percentage-change">
                              {' '}({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(2)}%)
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper function to format column names for display
const formatColumnName = (columnName) => {
  // Replace underscores with spaces and capitalize each word
  return columnName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default ResultsTable;