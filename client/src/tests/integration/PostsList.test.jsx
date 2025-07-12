// PostsList.test.jsx - Integration tests for PostsList component with API

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostsList from '../../components/PostsList';

// Mock fetch globally
global.fetch = jest.fn();

const mockPosts = [
  {
    _id: '1',
    title: 'First Post',
    excerpt: 'This is the first post excerpt',
    author: {
      username: 'user1',
      firstName: 'John',
      lastName: 'Doe',
    },
    category: {
      name: 'Technology',
      slug: 'technology',
    },
    publishedAt: '2024-01-15T10:00:00Z',
    readingTime: 5,
    likeCount: 10,
    commentCount: 3,
  },
  {
    _id: '2',
    title: 'Second Post',
    excerpt: 'This is the second post excerpt',
    author: {
      username: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    category: {
      name: 'Design',
      slug: 'design',
    },
    publishedAt: '2024-01-14T10:00:00Z',
    readingTime: 7,
    likeCount: 5,
    commentCount: 1,
  },
];

const mockApiResponse = {
  posts: mockPosts,
  pagination: {
    current: 1,
    pages: 1,
    total: 2,
    hasNext: false,
    hasPrev: false,
  },
};

describe('PostsList Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should fetch and display posts on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PostsList />);

    // Check loading state
    expect(screen.getByTestId('posts-loading')).toBeInTheDocument();

    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    // Verify API call
    expect(fetch).toHaveBeenCalledWith('/api/posts?page=1&limit=10');

    // Check if posts are rendered
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to load posts/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should retry fetching posts when retry button is clicked', async () => {
    // First call fails
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-error')).toBeInTheDocument();
    });

    // Second call succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle pagination correctly', async () => {
    const page2Response = {
      posts: [mockPosts[1]], // Different posts for page 2
      pagination: {
        current: 2,
        pages: 2,
        total: 3,
        hasNext: false,
        hasPrev: true,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    // Mock response for page 2
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => page2Response,
    });

    // Click next page
    const nextButton = screen.getByTestId('pagination-next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/posts?page=2&limit=10');
    });
  });

  it('should filter posts by category', async () => {
    const filteredResponse = {
      posts: [mockPosts[0]], // Only technology posts
      pagination: {
        current: 1,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    // Mock filtered response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => filteredResponse,
    });

    // Select category filter
    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'technology' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/posts?page=1&limit=10&category=technology');
    });
  });

  it('should search posts', async () => {
    const searchResponse = {
      posts: [mockPosts[0]], // Only matching posts
      pagination: {
        current: 1,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    // Mock search response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResponse,
    });

    // Perform search
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'React' } });
    
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/posts?page=1&limit=10&search=React');
    });
  });

  it('should handle like functionality when authenticated', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const mockUser = { id: 'user123', token: 'auth-token' };
    
    render(<PostsList user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    // Mock like response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Post liked', liked: true, likeCount: 11 }),
    });

    // Click like button on first post
    const likeButtons = screen.getAllByTestId('like-button');
    fireEvent.click(likeButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/posts/1/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer auth-token',
        },
      });
    });
  });

  it('should handle empty state when no posts are found', async () => {
    const emptyResponse = {
      posts: [],
      pagination: {
        current: 1,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-empty')).toBeInTheDocument();
    });

    expect(screen.getByText(/No posts found/)).toBeInTheDocument();
  });

  it('should handle HTTP error responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server error' }),
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Server error/)).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    jest.useFakeTimers();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PostsList />);

    await waitFor(() => {
      expect(screen.getByTestId('posts-list')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');

    // Type multiple characters quickly
    fireEvent.change(searchInput, { target: { value: 'R' } });
    fireEvent.change(searchInput, { target: { value: 'Re' } });
    fireEvent.change(searchInput, { target: { value: 'Rea' } });
    fireEvent.change(searchInput, { target: { value: 'React' } });

    // Fast-forward time
    jest.advanceTimersByTime(500);

    // Should only make one API call after debounce delay
    expect(fetch).toHaveBeenCalledTimes(1); // Initial load only

    jest.useRealTimers();
  });

  it('should handle component unmount during fetch', async () => {
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    fetch.mockReturnValueOnce(promise);

    const { unmount } = render(<PostsList />);

    // Unmount component before promise resolves
    unmount();

    // Resolve promise after unmount
    resolvePromise({
      ok: true,
      json: async () => mockApiResponse,
    });

    // Should not cause any errors or warnings
    await promise;
  });
});
