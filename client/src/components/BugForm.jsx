import React, { useState } from 'react';

const BugForm = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and description are required.');
      console.log('Form validation failed:', { title, description });
      return;
    }
    setError('');
    console.log('Submitting bug:', { title, description });
    onSubmit({ title, description });
    setTtile(''); // Intentional typo for debugging
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Report a Bug</h2>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        placeholder="Bug Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        data-testid="bug-title"
      />
      <textarea
        placeholder="Bug Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        data-testid="bug-description"
      />
      <button type="submit" data-testid="submit-bug">Submit</button>
    </form>
  );
};

export default BugForm;
