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
      <div className="banner">
        <a 
          href="https://www.theballotbook.com/?utm_source=election-tracker" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <img 
            src={`${process.env.PUBLIC_URL}/ballot_book.png`}
            alt="The Ballot Book"
          />
        </a>
      </div>
      
      <h1>San Diego County Board of Supervisors - District 1 (July 1 General Election)</h1>

      <div className="attribution-header">
        <p>
          Created by <a href="mailto:mason@edgewater-strategies.com">Mason Herron</a>. 
          Email with questions, feedback, or other inquiries.
        </p>
        <p>
          Follow <a href="https://x.com/mason_herron" target="_blank" rel="noopener noreferrer">@mason_herron</a> or <a href="https://www.linkedin.com/in/masonherron/" target="_blank" rel="noopener noreferrer">LinkedIn</a>.
        </p>
      </div>

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