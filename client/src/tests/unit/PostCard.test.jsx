// PostCard.test.jsx - Unit tests for PostCard component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCard from '../../components/PostCard';

const mockPost = {
  _id: '65f123456789abcdef123457',
  title: 'Test Post Title',
  excerpt: 'This is a test post excerpt that should be displayed on the card.',
  author: {
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
  },
  category: {
    name: 'Technology',
    slug: 'technology',
  },
  publishedAt: '2024-01-15T10:30:00Z',
  readingTime: 5,
  likeCount: 10,
  commentCount: 3,
  featuredImage: {
    url: 'https://example.com/image.jpg',
    alt: 'Test image',
  },
};

describe('PostCard Component', () => {
  it('renders post information correctly', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a test post excerpt/)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('displays like and comment counts', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // like count
    expect(screen.getByText('3')).toBeInTheDocument();  // comment count
  });

  it('renders featured image when provided', () => {
    render(<PostCard post={mockPost} />);
    
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders without featured image when not provided', () => {
    const postWithoutImage = { ...mockPost, featuredImage: null };
    render(<PostCard post={postWithoutImage} />);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('calls onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    render(<PostCard post={mockPost} onClick={handleClick} />);
    
    const card = screen.getByTestId('post-card');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledWith(mockPost);
  });

  it('displays correct publication date', () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('truncates long excerpts', () => {
    const postWithLongExcerpt = {
      ...mockPost,
      excerpt: 'This is a very long excerpt that should be truncated when it exceeds the maximum length allowed for display in the post card component. It should show ellipsis at the end.',
    };
    
    render(<PostCard post={postWithLongExcerpt} />);
    
    const excerpt = screen.getByTestId('post-excerpt');
    expect(excerpt.textContent.length).toBeLessThanOrEqual(150);
    expect(excerpt.textContent).toMatch(/\.\.\.$/);
  });

  it('applies hover styles on mouse enter and leave', () => {
    render(<PostCard post={mockPost} />);
    
    const card = screen.getByTestId('post-card');
    
    fireEvent.mouseEnter(card);
    expect(card).toHaveClass('post-card--hover');
    
    fireEvent.mouseLeave(card);
    expect(card).not.toHaveClass('post-card--hover');
  });

  it('shows loading state when specified', () => {
    render(<PostCard post={mockPost} loading={true} />);
    
    expect(screen.getByTestId('post-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Test Post Title')).not.toBeInTheDocument();
  });

  it('handles missing author gracefully', () => {
    const postWithoutAuthor = { ...mockPost, author: null };
    render(<PostCard post={postWithoutAuthor} />);
    
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('handles missing category gracefully', () => {
    const postWithoutCategory = { ...mockPost, category: null };
    render(<PostCard post={postWithoutCategory} />);
    
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('shows bookmark button when user is authenticated', () => {
    render(<PostCard post={mockPost} isAuthenticated={true} />);
    
    expect(screen.getByTestId('bookmark-button')).toBeInTheDocument();
  });

  it('hides bookmark button when user is not authenticated', () => {
    render(<PostCard post={mockPost} isAuthenticated={false} />);
    
    expect(screen.queryByTestId('bookmark-button')).not.toBeInTheDocument();
  });

  it('calls onLike handler when like button is clicked', () => {
    const handleLike = jest.fn();
    render(<PostCard post={mockPost} onLike={handleLike} isAuthenticated={true} />);
    
    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);
    
    expect(handleLike).toHaveBeenCalledWith(mockPost._id);
  });

  it('prevents click propagation on interactive elements', () => {
    const handleCardClick = jest.fn();
    const handleLike = jest.fn();
    
    render(
      <PostCard 
        post={mockPost} 
        onClick={handleCardClick} 
        onLike={handleLike} 
        isAuthenticated={true} 
      />
    );
    
    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);
    
    expect(handleLike).toHaveBeenCalled();
    expect(handleCardClick).not.toHaveBeenCalled();
  });
});
