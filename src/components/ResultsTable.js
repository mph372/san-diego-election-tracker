import React from 'react';

const ResultsTable = ({ results }) => {
  // Check if results array is empty
  if (!results || results.length === 0) {
    return <p>No election results available.</p>;
  }

  // Get the column headers from the first result object
  const columns = Object.keys(results[0]);

  return (
    <div className="results-table">
      <h3>Election Results</h3>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{formatColumnName(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td key={`${index}-${column}`}>{row[column]}</td>
                ))}
              </tr>
            ))}
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