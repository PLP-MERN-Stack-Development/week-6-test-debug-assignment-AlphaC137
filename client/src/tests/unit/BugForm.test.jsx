import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BugForm from '../../components/BugForm';

describe('BugForm', () => {
  it('renders form fields', () => {
    render(<BugForm onSubmit={jest.fn()} />);
    expect(screen.getByTestId('bug-title')).toBeInTheDocument();
    expect(screen.getByTestId('bug-description')).toBeInTheDocument();
    expect(screen.getByTestId('submit-bug')).toBeInTheDocument();
  });

  it('shows error if fields are empty', () => {
    render(<BugForm onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByTestId('submit-bug'));
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('calls onSubmit with valid input', () => {
    const onSubmit = jest.fn();
    render(<BugForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId('bug-title'), { target: { value: 'Bug title' } });
    fireEvent.change(screen.getByTestId('bug-description'), { target: { value: 'Bug description' } });
    fireEvent.click(screen.getByTestId('submit-bug'));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Bug title', description: 'Bug description' });
  });
});
