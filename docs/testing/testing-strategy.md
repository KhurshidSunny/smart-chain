# Smart-Chain Testing Strategy

## Introduction

This testing strategy outlines the approach to ensure the Smart-Chain Order Processing and QR Code Tracking System MVP is functional, reliable, and user-friendly during development. The goal is to integrate testing into the daily workflow, catching issues early and ensuring the system meets business objectives like order visibility, inventory accuracy, and secure access.

### Objectives
- **Quality Assurance**: Validate functionality of all MVP features (e.g., order creation, QR code tracking).
- **Continuous Validation**: Test incrementally as features are developed.
- **Reliability**: Ensure microservices and frontend work seamlessly together.
- **Security**: Verify role-based access and data protection.
- **Scalability**: Lay a foundation for future testing enhancements.

## Testing Scope

### In Scope
- **Frontend**: All pages and components in `frontend/src/` (e.g., `LoginPage.jsx`, `OrderCreationPage.jsx`).
- **Microservices**: IAM, Sales, Inventory, Warehouse, Logistics, Feedback (`microservices/`).
- **Infrastructure**: RabbitMQ messaging, MongoDB connectivity.
- **MVP Features**: User auth, order management, inventory tracking, QR code operations, shipping, feedback.

### Out of Scope (MVP)
- Advanced analytics, multi-warehouse support, mobile apps, and other future features.
- Full E2E automation (limited to manual validation for MVP).

## Testing Types and Approach

### Unit Testing
- **Purpose**: Test individual components, functions, and microservice logic in isolation.
- **Scope**: React components, Redux slices, utility functions, service controllers/models.
- **Approach**:
  - Write tests alongside code development.
  - Mock dependencies (e.g., API calls, Redux store) using Jest mocks.
  - Example: Test `authController.js` login logic with mocked `jwtService`.

### Integration Testing
- **Purpose**: Verify interactions between components, services, and external systems (e.g., MongoDB, RabbitMQ).
- **Scope**: Page-level flows (e.g., `OrderDetailPage.jsx` with API calls), service-to-service communication.
- **Approach**:
  - Use mock API responses (Axios Mock Adapter) and RabbitMQ stubs.
  - Test Redux state updates and UI responses.
  - Example: Test `OrderCreationPage.jsx` submitting an order and updating Redux.

### End-to-End (E2E) Testing
- **Purpose**: Validate critical user workflows across services.
- **Scope**: Limited to manual testing for MVP (e.g., login → order → ship → feedback).
- **Approach**:
  - Manually execute key flows in a staging environment.
  - Plan for automation (e.g., Playwright) post-MVP.
  - Example: Test warehouse staff picking and scanning an order.

### Manual Testing
- **Purpose**: Validate UI/UX, responsive design, and edge cases.
- **Scope**: Cross-browser testing (Chrome, Firefox), device testing (desktop, mobile).
- **Approach**:
  - Use checklists per page (e.g., "Login button disables during loading").
  - Test QR code scanning on real devices.

### Security Testing
- **Purpose**: Ensure RBAC and data protection work as expected.
- **Scope**: JWT auth, role permissions, HTTPS enforcement.
- **Approach**:
  - Unit test `authMiddleware.js` for role checks.
  - Manually test unauthorized access scenarios.

### Performance Testing
- **Purpose**: Assess basic responsiveness (e.g., page loads, QR scanning).
- **Scope**: Lightweight checks during development.
- **Approach**:
  - Use browser dev tools for load times.
  - Plan for Lighthouse post-MVP.

## Testing Tools and Technologies

- **Jest**: Unit and integration testing for frontend and backend.
- **React Testing Library**: Frontend component testing.
- **Mocha/Chai/Sinon**: Backend microservice testing.
- **Axios Mock Adapter**: Mock microservice API responses.
- **QuaggaJS Mocks**: Simulate QR code scanning (e.g., mock `onDetected`).
- **Mongoose Mocks**: Stub MongoDB interactions.
- **amqplib Mocks**: Simulate RabbitMQ events.
- **GitHub Actions**: CI/CD pipeline for automated test runs.
- **Swagger**: Validate API contracts manually during dev.

## Testing Environments

- **Local Development**:
  - Frontend: `npm start` with mocked APIs.
  - Backend: Dockerized services (`docker-compose.yml`) with local MongoDB/RabbitMQ.
  - Tools: Postman for API testing, browser dev tools for UI.
- **Staging Environment**:
  - Deployed via Heroku/AWS Amplify with real MongoDB Atlas/CloudAMQP.
  - Used for manual E2E and integration tests.
- **Test Data**:
  - Seed scripts in each microservice (`microservices/*/scripts/seed.js`).
  - Sample users, orders, products, etc., for consistent testing.

## Test Case Development

### Guidelines
- Write tests in `.test.jsx` or `.test.js` files next to their targets.
- Use descriptive `it` blocks (e.g., "renders login form with default values").
- Mock external dependencies to isolate logic.
- Test success, failure, and edge cases (e.g., empty inputs, network errors).

### Example Test Case (LoginPage.jsx)
```javascript
it('handles login failure and displays error', async () => {
    authService.loginUser.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(loginFailure('Invalid credentials'));
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
});