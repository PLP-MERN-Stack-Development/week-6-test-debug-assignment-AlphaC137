import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PostCard.css';

const PostCard = ({ 
  post, 
  onClick, 
  onLike, 
  onBookmark, 
  isAuthenticated = false, 
  loading = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (loading) {
    return (
      <div className="post-card post-card--loading" data-testid="post-card-skeleton">
        <div className="post-card__image-skeleton"></div>
        <div className="post-card__content">
          <div className="post-card__title-skeleton"></div>
          <div className="post-card__excerpt-skeleton"></div>
          <div className="post-card__meta-skeleton"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(post);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(post._id);
    }
  };

  const cardClassName = `post-card ${isHovered ? 'post-card--hover' : ''}`;

  return (
    <article 
      className={cardClassName}
      data-testid="post-card"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {post.featuredImage && (
        <div className="post-card__image">
          <img 
            src={post.featuredImage.url} 
            alt={post.featuredImage.alt || post.title}
            loading="lazy"
          />
        </div>
      )}
      
      <div className="post-card__content">
        <div className="post-card__meta">
          <span className="post-card__category">
            {post.category?.name || 'Uncategorized'}
          </span>
          <span className="post-card__reading-time">
            {post.readingTime} min read
          </span>
        </div>
        
        <h3 className="post-card__title">{post.title}</h3>
        
        <p className="post-card__excerpt" data-testid="post-excerpt">
          {truncateText(post.excerpt)}
        </p>
        
        <div className="post-card__footer">
          <div className="post-card__author">
            <span className="post-card__author-name">
              {post.author 
                ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username
                : 'Anonymous'
              }
            </span>
            <span className="post-card__date">
              {formatDate(post.publishedAt)}
            </span>
          </div>
          
          <div className="post-card__actions">
            <button 
              className="post-card__action-btn"
              data-testid="like-button"
              onClick={handleLike}
              disabled={!isAuthenticated}
            >
              <span className="post-card__action-icon">♥</span>
              <span className="post-card__action-count">{post.likeCount || 0}</span>
            </button>
            
            <button 
              className="post-card__action-btn"
              data-testid="comment-button"
              disabled
            >
              <span className="post-card__action-icon">💬</span>
              <span className="post-card__action-count">{post.commentCount || 0}</span>
            </button>
            
            {isAuthenticated && (
              <button 
                className="post-card__action-btn"
                data-testid="bookmark-button"
                onClick={handleBookmark}
              >
                <span className="post-card__action-icon">🔖</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    author: PropTypes.shape({
      username: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
    category: PropTypes.shape({
      name: PropTypes.string,
      slug: PropTypes.string,
    }),
    publishedAt: PropTypes.string,
    readingTime: PropTypes.number,
    likeCount: PropTypes.number,
    commentCount: PropTypes.number,
    featuredImage: PropTypes.shape({
      url: PropTypes.string,
      alt: PropTypes.string,
    }),
  }).isRequired,
  onClick: PropTypes.func,
  onLike: PropTypes.func,
  onBookmark: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
};

export default PostCard;
