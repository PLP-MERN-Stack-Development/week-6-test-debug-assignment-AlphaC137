// cypress/support/commands.js - Custom Cypress commands

// Command to login a user
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('not.include', '/login');
});

// Command to register a user
Cypress.Commands.add('register', (userData = {}) => {
  const defaultUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };
  
  const user = { ...defaultUserData, ...userData };
  
  cy.visit('/register');
  cy.get('[data-testid="username-input"]').type(user.username);
  cy.get('[data-testid="email-input"]').type(user.email);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="first-name-input"]').type(user.firstName);
  cy.get('[data-testid="last-name-input"]').type(user.lastName);
  cy.get('[data-testid="register-button"]').click();
});

// Command to create a post via API
Cypress.Commands.add('createPost', (postData = {}) => {
  const defaultPostData = {
    title: 'Test Post',
    content: 'This is a test post content that meets the minimum length requirements.',
    category: '65f123456789abcdef123456',
  };
  
  const post = { ...defaultPostData, ...postData };
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/posts`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: post,
  });
});

// Command to seed database with test data
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    failOnStatusCode: false,
  });
});

// Command to clear database
Cypress.Commands.add('clearDatabase', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/clear`,
    failOnStatusCode: false,
  });
});

// Command to wait for element to be visible and interactable
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible').should('not.be.disabled');
});

// Command to check accessibility
Cypress.Commands.add('checkA11y', (selector = null, options = {}) => {
  cy.injectAxe();
  cy.checkA11y(selector, options);
});

// Command to mock API responses
Cypress.Commands.add('mockApi', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response,
  });
});

// Command to upload file
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/jpeg') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('fake file contents'),
    fileName,
    mimeType: fileType,
  });
});

// Command to take screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});

// Command to simulate slow network
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(2000); // 2 second delay
    });
  });
});

// Command to test responsive design
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 320, height: 568 },  // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1280, height: 720 }, // Desktop
  ];
  
  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    callback(viewport);
  });
});

// Command to verify form validation
Cypress.Commands.add('testFormValidation', (formSelector, fields) => {
  fields.forEach((field) => {
    cy.get(`${formSelector} [data-testid="${field.selector}"]`)
      .clear()
      .type(field.invalidValue || '')
      .blur();
    
    if (field.errorMessage) {
      cy.get(`[data-testid="${field.selector}-error"]`)
        .should('be.visible')
        .and('contain', field.errorMessage);
    }
  });
});
