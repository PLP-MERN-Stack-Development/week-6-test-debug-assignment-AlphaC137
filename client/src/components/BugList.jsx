import React from 'react';

const BugList = ({ bugs, onStatusChange, onDelete }) => {
  if (!bugs.length) {
    console.log('Bug list is empty');
    return <div data-testid="empty-list">No bugs reported.</div>;
  }
  return (
    <ul>
      {bugs.map(bug => (
        <li key={bug._id} data-testid="bug-item">
          <strong>{bug.title}</strong> - {bug.description}
          <div>Status: {bug.status}</div>
          <select
            value={bug.status}
            onChange={e => {
              console.log('Status change:', { id: bug._id, status: e.target.value });
              onStatusChange(bug._id, e.target.value);
            }}
            data-testid={`status-select-${bug._id}`}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button onClick={() => {
            console.log('Deleting bug:', bug._id);
            onDelete(bug._id);
          }} data-testid={`delete-bug-${bug._id}`}>Delete</button>
        </li>
      ))}
    </ul>
  );
};

export default BugList;
