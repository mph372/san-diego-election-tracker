import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultsChart = ({ results, metadata, batchesHistory }) => {
  if (!results || results.length === 0 || !metadata || !metadata.updates || !batchesHistory) {
    return null;
  }

  // Get the contest name from the first result
  const contestName = results[0]['Contest Name'];
  
  // Sort the current results by vote count (descending)
  const sortedResults = [...results].sort((a, b) => 
    (b['Total Votes'] || 0) - (a['Total Votes'] || 0)
  );
  
  const candidateColors = {};
  if (metadata && metadata.candidates) {
    metadata.candidates.forEach(c => {
      candidateColors[c.name] = c.color;
    });
  }
  
  // Fallback colors if we have more candidates than defined colors
  const fallbackColors = [
    '#8b4513', // Saddle Brown
    '#4b0082', // Indigo
    '#556b2f', // Dark Olive Green
    '#dc143c', // Crimson
    '#00ff7f'  // Spring Green
  ];
  
  // Get the color for a candidate
  const getCandidateColor = (candidateName) => {
    return candidateColors[candidateName] || fallbackColors[0];
  };

  // Prepare data for the line chart
  // First, create an array of data points for each batch
  const chartData = metadata.updates.map(batch => {
    const batchData = batchesHistory[batch.batchNumber] || [];
    
    // Start with batch information
    const dataPoint = {
      name: `Batch ${batch.batchNumber}`,
      date: new Date(batch.timestamp).toLocaleDateString(),
    };
    
    // Add each candidate's vote count
    sortedResults.forEach(candidate => {
      const candidateInBatch = batchData.find(
        item => item['Candidate Name'] === candidate['Candidate Name']
      );
      
      // Add the votes for this candidate in this batch
      dataPoint[candidate['Candidate Name']] = 
        candidateInBatch ? candidateInBatch['Total Votes'] : 0;
    });
    
    return dataPoint;
  });

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const batchInfo = chartData.find(item => item.name === label);
      
      // Sort the payload by vote count (descending)
      const sortedPayload = [...payload].sort((a, b) => 
        (b.value || 0) - (a.value || 0)
      );
      
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p className="label"><strong>{label} - {batchInfo.date}</strong></p>
          {sortedPayload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              <span style={{ fontWeight: 'bold' }}>{entry.name}: </span>
              {new Intl.NumberFormat().format(entry.value || 0)} votes
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="results-chart">
      <h3>Vote Growth Over Time - {contestName}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => new Intl.NumberFormat().format(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Create a line for each candidate */}
          {sortedResults.map((candidate, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={candidate['Candidate Name']}
              name={candidate['Candidate Name']}
              stroke={getCandidateColor(candidate['Candidate Name'])}
              strokeWidth={2}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;