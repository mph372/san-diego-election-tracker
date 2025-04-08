// src/App.js
import React, { useEffect } from 'react';
import './App.css';
import ElectionTracker from './components/ElectionTracker';
import { initGA, pageView } from './utils/analytics';

function App() {
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Track page view on component mount
    pageView(window.location.pathname + window.location.search);
  }, []);

  return (
    <div className="App">
      <h1>San Diego County Board of Supervisors - District 1 (Special Election)</h1>

      <p className="creator-info">
        Created by Mason Herron. If you have questions or issues, contact{' '}
        <a href="mailto:mason@edgewater-strategies.com">mason@edgewater-strategies.com</a> or 
        connect with me on{' '}
        <a href="https://www.linkedin.com/in/masonherron/" target="_blank" rel="noopener noreferrer">LinkedIn</a>{' '}
        or{' '}
        <a href="https://x.com/mason_herron" target="_blank" rel="noopener noreferrer">Twitter</a>
      </p>

      <div className="important-links">
        <a href="https://github.com/mph372/san-diego-election-tracker/tree/main/public/data" target="_blank" rel="noopener noreferrer" className="action-link">Download Raw Data</a>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSd3ioQJxgrYjSlOKnjyYPZ0zSJkXONyrN8nBT4w60igDMTRiQ/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="action-link">Get Email Updates</a>
      </div>

      <main>
        <ElectionTracker />
      </main>
      <footer>
        <p>Data source: San Diego County Registrar of Voters</p>
      </footer>
    </div>
  );
}

export default App;