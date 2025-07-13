// PostsList.jsx - A component that displays a list of posts

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PostCard from './PostCard';
import { useApi } from '../hooks/useApi';
import './PostsList.css';

const PostsList = ({ 
  endpoint = '/api/posts',
  limit = 10,
  onPostClick,
  showActions = true,
  emptyMessage = 'No posts found',
  className = ''
}) => {
  const { data: response, loading, error, request } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Extract posts and pagination from response
  const posts = response?.posts || response || [];
  const pagination = response?.pagination || { current: 1, pages: 1, total: 0, hasNext: false, hasPrev: false };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });
        
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        
        const url = `${endpoint}?${params.toString()}`;
        await request(url);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, [endpoint, limit, currentPage, selectedCategory, request]);

  const filteredPosts = posts && Array.isArray(posts) ? posts.filter(post => {
    const title = post.title || '';
    const content = post.content || post.excerpt || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           content.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  const handleRefresh = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
    });
    
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    
    const url = `${endpoint}?${params.toString()}`;
    request(url);
  };

  const handleSearch = () => {
    // Search functionality
    const params = new URLSearchParams({
      page: '1',
      limit: limit.toString(),
      search: searchTerm,
    });
    
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    
    const url = `${endpoint}?${params.toString()}`;
    request(url);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className={`posts-list loading ${className}`}>
        <div className="loading-spinner" role="status" aria-label="Loading posts" data-testid="posts-loading">
          Loading posts...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`posts-list error ${className}`}>
        <div className="error-message" role="alert" data-testid="posts-error">
          <h3>Failed to load posts</h3>
          <p>{error.message}</p>
          <button 
            type="button" 
            onClick={handleRefresh}
            className="btn retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`posts-list ${className}`} data-testid="posts-list">
      <div className="posts-list-header">
        <h2>Posts</h2>
        <div className="posts-actions">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="category-filter"
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            <option value="technology">Technology</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            data-testid="search-input"
          />
          <button 
            type="button" 
            onClick={handleSearch}
            className="btn search-btn"
            data-testid="search-button"
          >
            Search
          </button>
          <button 
            type="button" 
            onClick={handleRefresh}
            className="btn refresh-btn"
            data-testid="refresh-button"
          >
            Refresh
          </button>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="empty-state" data-testid="posts-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="posts-grid" data-testid="posts-grid">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id || post._id}
              post={post}
              onClick={onPostClick}
              showActions={showActions}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination" data-testid="pagination">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="btn pagination-btn"
            data-testid="pagination-prev"
          >
            Previous
          </button>
          
          <span className="pagination-info" data-testid="pagination-info">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNext}
            className="btn pagination-btn"
            data-testid="pagination-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

PostsList.propTypes = {
  endpoint: PropTypes.string,
  limit: PropTypes.number,
  onPostClick: PropTypes.func,
  showActions: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

export default PostsList;
