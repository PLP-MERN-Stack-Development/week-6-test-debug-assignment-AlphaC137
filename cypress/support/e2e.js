// cypress/support/e2e.js - Cypress support file for e2e tests

import './commands';

// Import Cypress commands
import 'cypress-real-events/support';

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // You can add logic to handle specific errors
  console.error('Uncaught exception:', err);
  
  // Don't fail the test on unhandled promise rejections from the app
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  return false;
});

// Set up global configuration
beforeEach(() => {
  // Clear local storage before each test
  cy.clearLocalStorage();
  
  // Clear cookies
  cy.clearCookies();
  
  // Set viewport
  cy.viewport(1280, 720);
});
