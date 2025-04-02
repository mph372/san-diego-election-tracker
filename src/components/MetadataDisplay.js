import React from 'react';

const MetadataDisplay = ({ metadata }) => {
  if (!metadata) {
    return null;
  }

  return (
    <div className="metadata-display">
      <h3>Current Update Status</h3>
      <div className="metadata-grid">
        <div className="metadata-item">
          <span className="metadata-label">Last Updated:</span>
          <span className="metadata-value">
            {new Date(metadata.timestamp).toLocaleString()}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Registered Voters:</span>
          <span className="metadata-value">
            {new Intl.NumberFormat().format(metadata.registeredVoters)}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Ballots Counted:</span>
          <span className="metadata-value">
            {new Intl.NumberFormat().format(metadata.ballotsCountedTotal)}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Mail Ballots:</span>
          <span className="metadata-value">
            {new Intl.NumberFormat().format(metadata.mailBallots)}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Vote Center Ballots:</span>
          <span className="metadata-value">
            {new Intl.NumberFormat().format(metadata.voteCenterBallots)}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Estimated Remaining:</span>
          <span className="metadata-value">
            {new Intl.NumberFormat().format(metadata.estimatedBallotsRemaining)}
          </span>
        </div>
        
        <div className="metadata-item">
          <span className="metadata-label">Turnout:</span>
          <span className="metadata-value">
            {((metadata.ballotsCountedTotal / metadata.registeredVoters) * 100).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetadataDisplay;