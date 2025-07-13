import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BugList from '../../components/BugList';

describe('BugList', () => {
  const bugs = [
    { _id: '1', title: 'Bug 1', description: 'Desc 1', status: 'open' },
    { _id: '2', title: 'Bug 2', description: 'Desc 2', status: 'resolved' }
  ];

  it('renders empty state', () => {
    render(<BugList bugs={[]} onStatusChange={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByTestId('empty-list')).toBeInTheDocument();
  });

  it('renders bug items', () => {
    render(<BugList bugs={bugs} onStatusChange={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getAllByTestId('bug-item')).toHaveLength(2);
  });

  it('calls onStatusChange when status is changed', () => {
    const onStatusChange = jest.fn();
    render(<BugList bugs={bugs} onStatusChange={onStatusChange} onDelete={jest.fn()} />);
    fireEvent.change(screen.getByTestId('status-select-1'), { target: { value: 'resolved' } });
    expect(onStatusChange).toHaveBeenCalledWith('1', 'resolved');
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<BugList bugs={bugs} onStatusChange={jest.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('delete-bug-1'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
