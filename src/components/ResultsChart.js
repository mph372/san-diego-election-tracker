import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

const ResultsChart = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Get the contest name from the first result
  const contestName = results[0]['Contest Name'];
  
  // Only use the data needed for the chart
  const chartData = results.map(result => ({
    name: result['Candidate Name'],
    votes: result['Total Votes'] || 0,
    party: result['Party']
  }));

  // Sort by vote count (descending)
  chartData.sort((a, b) => b.votes - a.votes);

  // Define party colors
  const getPartyColor = (party) => {
    switch (party) {
      case 'Democratic':
      case 'DEM':
        return '#0000ff'; // Blue
      case 'Republican':
      case 'REP':
        return '#ff0000'; // Red
      case 'Independent':
      case 'IND':
        return '#808080'; // Gray
      case 'Green':
      case 'GRN':
        return '#00ff00'; // Green
      case 'Libertarian':
      case 'LIB':
        return '#ffff00'; // Yellow
      default:
        return '#800080'; // Purple for others
    }
  };

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label"><strong>{data.name}</strong></p>
          <p className="label">Party: {data.party || 'N/A'}</p>
          <p className="label">Votes: {new Intl.NumberFormat().format(data.votes)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="results-chart">
      <h3>{contestName}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 100
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
          />
          <YAxis tickFormatter={(value) => new Intl.NumberFormat().format(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="votes" 
            name="Total Votes"
            fillOpacity={0.8}
          >
            {/* Use different colors based on party */}
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPartyColor(entry.party)} />
            ))}
            <LabelList 
              dataKey="votes" 
              position="top" 
              formatter={(value) => new Intl.NumberFormat().format(value)} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;