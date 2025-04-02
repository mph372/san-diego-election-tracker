// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import ElectionTracker from './components/ElectionTracker';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>San Diego County Board of Supervisors Election Tracker</h1>
      </header>
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