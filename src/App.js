// src/App.js
import React from 'react';
import './App.css';
import ElectionTracker from './components/ElectionTracker';

function App() {
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