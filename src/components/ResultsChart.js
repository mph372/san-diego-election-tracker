import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResultsChart = ({ results }) => {
  // Only use the data needed for the chart
  const chartData = results.map(result => ({
    name: result['Candidate Name'],
    votes: result['Total Votes'],
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

  return (
    <div className="results-chart">
      <h3>Vote Totals by Candidate</h3>
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
          <YAxis />
          <Tooltip formatter={(value) => new Intl.NumberFormat().format(value)} />
          <Legend />
          <Bar 
            dataKey="votes" 
            name="Total Votes" 
            fillOpacity={0.8}
            // Use different colors based on party
            fill={(entry) => getPartyColor(entry.party)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultsChart;