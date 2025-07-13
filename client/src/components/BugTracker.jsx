import React, { useState, useEffect } from 'react';
import BugForm from './BugForm';
import BugList from './BugList';
import ErrorBoundary from './ErrorBoundary';

const BugTracker = () => {
  const [bugs, setBugs] = useState([]);
  const [error, setError] = useState('');

  // Simulate API calls
  useEffect(() => {
    // Initial fetch (replace with real API)
    setBugs([
      { _id: '1', title: 'Sample Bug', description: 'This is a sample bug.', status: 'open' }
    ]);
  }, []);

  const addBug = (bug) => {
    // Simulate API call
    setBugs([...bugs, { ...bug, _id: Date.now().toString(), status: 'open' }]);
  };

  const updateStatus = (id, status) => {
    setBugs(bugs.map(bug => bug._id === id ? { ...bug, status } : bug));
  };

  const deleteBug = (id) => {
    setBugs(bugs.filter(bug => bug._id !== id));
  };

  return (
    <ErrorBoundary>
      <div>
        <BugForm onSubmit={addBug} />
        {error && <div className="error">{error}</div>}
        <BugList bugs={bugs} onStatusChange={updateStatus} onDelete={deleteBug} />
      </div>
    </ErrorBoundary>
  );
};

export default BugTracker;
