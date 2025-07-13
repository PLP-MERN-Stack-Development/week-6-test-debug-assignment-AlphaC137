import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BugTracker from '../../components/BugTracker';

describe('BugTracker', () => {
  it('renders BugForm and BugList', () => {
    render(<BugTracker />);
    expect(screen.getByText(/report a bug/i)).toBeInTheDocument();
    expect(screen.getByTestId('bug-item')).toBeInTheDocument();
  });

  it('adds a bug on form submit', () => {
    render(<BugTracker />);
    fireEvent.change(screen.getByTestId('bug-title'), { target: { value: 'New Bug' } });
    fireEvent.change(screen.getByTestId('bug-description'), { target: { value: 'Bug details' } });
    fireEvent.click(screen.getByTestId('submit-bug'));
    expect(screen.getByText(/new bug/i)).toBeInTheDocument();
  });

  it('updates bug status', () => {
    render(<BugTracker />);
    fireEvent.change(screen.getByTestId('status-select-1'), { target: { value: 'resolved' } });
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it('deletes a bug', () => {
    render(<BugTracker />);
    fireEvent.click(screen.getByTestId('delete-bug-1'));
    expect(screen.queryByText(/sample bug/i)).not.toBeInTheDocument();
  });
});
