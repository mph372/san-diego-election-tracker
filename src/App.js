// src/App.js
import React from 'react';
import './App.css';
import ElectionTracker from './components/ElectionTracker';

function App() {
  return (
    <div className="App">

        <h1>San Diego County Board of Supervisors - District 1 (Special Election)</h1>

      <p className="creator-info">Created by Mason Herron. If you have questions or issues, contact mason@edgewater-strategies.com</p>

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