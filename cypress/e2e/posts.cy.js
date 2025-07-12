// cypress/e2e/posts.cy.js - End-to-end tests for post functionality

describe('Posts Management E2E Tests', () => {
  beforeEach(() => {
    // Clear database and seed with test data
    cy.clearDatabase();
    cy.seedDatabase();
    
    // Visit the homepage
    cy.visit('/');
  });

  afterEach(() => {
    // Clean up after each test
    cy.clearDatabase();
  });

  describe('Posts List Page', () => {
    it('should display list of posts on homepage', () => {
      // Check if posts are displayed
      cy.get('[data-testid="posts-list"]').should('be.visible');
      cy.get('[data-testid="post-card"]').should('have.length.greaterThan', 0);
      
      // Check post card elements
      cy.get('[data-testid="post-card"]').first().within(() => {
        cy.get('[data-testid="post-title"]').should('be.visible');
        cy.get('[data-testid="post-excerpt"]').should('be.visible');
        cy.get('[data-testid="post-author"]').should('be.visible');
        cy.get('[data-testid="post-date"]').should('be.visible');
      });
    });

    it('should paginate posts correctly', () => {
      // Check pagination controls
      cy.get('[data-testid="pagination"]').should('be.visible');
      
      // Navigate to page 2
      cy.get('[data-testid="pagination-next"]').click();
      cy.url().should('include', 'page=2');
      
      // Navigate back to page 1
      cy.get('[data-testid="pagination-prev"]').click();
      cy.url().should('include', 'page=1');
    });

    it('should filter posts by category', () => {
      // Select a category filter
      cy.get('[data-testid="category-filter"]').select('Technology');
      
      // Verify URL and filtered results
      cy.url().should('include', 'category=technology');
      cy.get('[data-testid="post-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="post-category"]').should('contain', 'Technology');
      });
    });

    it('should search posts', () => {
      const searchTerm = 'React';
      
      // Perform search
      cy.get('[data-testid="search-input"]').type(searchTerm);
      cy.get('[data-testid="search-button"]').click();
      
      // Verify search results
      cy.url().should('include', `search=${searchTerm}`);
      cy.get('[data-testid="search-results"]').should('be.visible');
      cy.get('[data-testid="post-card"]').each(($card) => {
        cy.wrap($card).should('contain.text', searchTerm);
      });
    });
  });

  describe('Individual Post Page', () => {
    it('should display post details when clicked', () => {
      // Click on first post
      cy.get('[data-testid="post-card"]').first().click();
      
      // Verify we're on the post detail page
      cy.url().should('include', '/posts/');
      
      // Check post content
      cy.get('[data-testid="post-title"]').should('be.visible');
      cy.get('[data-testid="post-content"]').should('be.visible');
      cy.get('[data-testid="post-author"]').should('be.visible');
      cy.get('[data-testid="post-date"]').should('be.visible');
      cy.get('[data-testid="post-category"]').should('be.visible');
    });

    it('should show 404 page for non-existent post', () => {
      cy.visit('/posts/non-existent-post-id', { failOnStatusCode: false });
      cy.get('[data-testid="404-page"]').should('be.visible');
      cy.get('[data-testid="404-message"]').should('contain', 'Post not found');
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user successfully', () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-testid="username-input"]').type(userData.username);
      cy.get('[data-testid="email-input"]').type(userData.email);
      cy.get('[data-testid="password-input"]').type(userData.password);
      cy.get('[data-testid="first-name-input"]').type(userData.firstName);
      cy.get('[data-testid="last-name-input"]').type(userData.lastName);
      
      // Submit form
      cy.get('[data-testid="register-button"]').click();
      
      // Verify redirect to login or dashboard
      cy.url().should('not.include', '/register');
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Registration successful');
    });

    it('should login existing user successfully', () => {
      cy.visit('/login');
      
      // Fill login form
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Verify redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle login with invalid credentials', () => {
      cy.visit('/login');
      
      // Fill with invalid credentials
      cy.get('[data-testid="email-input"]').type('invalid@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      
      // Submit form
      cy.get('[data-testid="login-button"]').click();
      
      // Verify error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Invalid email or password');
    });

    it('should logout user successfully', () => {
      // Login first
      cy.login();
      
      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Verify redirect to homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });
  });

  describe('Post Creation (Authenticated)', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should create a new post successfully', () => {
      const postData = {
        title: 'New Test Post from E2E',
        content: 'This is the content of the new test post created during end-to-end testing. It contains enough text to meet the minimum requirements.',
        category: 'Technology',
      };

      cy.visit('/posts/new');
      
      // Fill post form
      cy.get('[data-testid="post-title-input"]').type(postData.title);
      cy.get('[data-testid="post-content-input"]').type(postData.content);
      cy.get('[data-testid="post-category-select"]').select(postData.category);
      
      // Submit form
      cy.get('[data-testid="create-post-button"]').click();
      
      // Verify redirect to new post
      cy.url().should('include', '/posts/');
      cy.get('[data-testid="post-title"]').should('contain', postData.title);
      cy.get('[data-testid="post-content"]').should('contain', postData.content);
    });

    it('should validate required fields', () => {
      cy.visit('/posts/new');
      
      // Try to submit empty form
      cy.get('[data-testid="create-post-button"]').click();
      
      // Check validation errors
      cy.get('[data-testid="title-error"]')
        .should('be.visible')
        .and('contain', 'Title is required');
      
      cy.get('[data-testid="content-error"]')
        .should('be.visible')
        .and('contain', 'Content is required');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.testResponsive((viewport) => {
        cy.visit('/');
        
        if (viewport.width < 768) {
          // Mobile specific tests
          cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
          cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
        } else {
          // Desktop specific tests
          cy.get('[data-testid="desktop-nav"]').should('be.visible');
          cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate slow network
      cy.simulateSlowNetwork();
      
      cy.visit('/');
      
      // Check loading states
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Wait for content to load
      cy.get('[data-testid="posts-list"]', { timeout: 30000 }).should('be.visible');
    });

    it('should display error message when API is down', () => {
      // Mock API error
      cy.mockApi('GET', '**/api/posts**', { error: 'Server error' }, 500);
      
      cy.visit('/');
      
      // Check error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to load posts');
    });
  });

  describe('Performance', () => {
    it('should load homepage within reasonable time', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.get('[data-testid="posts-list"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds
      });
    });
  });

  describe('Accessibility', () => {
    it('should meet WCAG accessibility standards', () => {
      cy.visit('/');
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should be navigable with keyboard', () => {
      cy.visit('/');
      
      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'skip-link');
      
      cy.tab();
      cy.focused().should('have.attr', 'data-testid', 'home-link');
    });
  });
});
