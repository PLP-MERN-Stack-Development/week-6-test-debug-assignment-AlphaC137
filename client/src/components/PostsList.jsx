// PostsList.jsx - A component that displays a list of posts

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PostCard from './PostCard';
import { useApi } from '../hooks/useApi';
import './PostsList.css';

const PostsList = ({ 
  endpoint = '/api/posts',
  limit,
  onPostClick,
  showActions = true,
  emptyMessage = 'No posts found',
  className = ''
}) => {
  const { data: posts, loading, error, request } = useApi();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const url = limit ? `${endpoint}?limit=${limit}` : endpoint;
        await request(url);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, [endpoint, limit, request]);

  const filteredPosts = posts && Array.isArray(posts) ? posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleRefresh = () => {
    const url = limit ? `${endpoint}?limit=${limit}` : endpoint;
    request(url);
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
          <h3>Error loading posts</h3>
          <p>{error.message}</p>
          <button 
            type="button" 
            onClick={handleRefresh}
            className="btn retry-btn"
          >
            Try Again
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
