# Authentication Tests

This directory contains integration tests for the authentication functionality of the Memories Album API.

## Test Coverage

The tests cover the following functionality:

### User Registration
- Successful registration with valid data
- Error handling for duplicate email
- Error handling for duplicate username
- Validation of input data

### User Login
- Successful login with valid credentials
- Error handling for incorrect password
- Error handling for non-existent user
- Validation of input data

### Protected Routes
- Accessing protected routes with valid token
- Error handling for missing token
- Error handling for invalid token
- Error handling for expired token
- Error handling for token with non-existent user

## Setup

### Environment Variables

Create a `jset.setup.js` file in the root directory with the following variables:

```
process.env.JWT_SECRET = 'your_jwt_secret';
process.env.JWT_EXPIRATION = '1h';
process.env.MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/memories-album-test';
process.env.FRONTEND_URL = 'http://localhost:5173';
```

Alternatively, you can set these environment variables directly in your test environment.

### MongoDB

Make sure you have MongoDB running locally, or update the `MONGO_URI_TEST` to point to your test database.

## Running the Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The tests are organized in a describe-it structure:

```
Auth Routes
  User Registration
    ✓ should register a new user successfully
    ✓ should return 409 if email already exists
    ✓ should return 409 if username already exists
    ✓ should return 400 if validation fails
  User Login
    ✓ should login a user successfully
    ✓ should return 401 if password is incorrect
    ✓ should return 401 if user does not exist
    ✓ should return 400 if validation fails
  Protected Routes
    ✓ should access protected route with valid token
    ✓ should return 401 if no token is provided
    ✓ should return 401 if token is invalid
    ✓ should return 401 if token is expired
    ✓ should return 401 if user does not exist
```

## Debugging

If you encounter issues with the tests:

1. Check that MongoDB is running and accessible
2. Verify that your environment variables are set correctly
3. Look for error messages in the test output
4. Try running a single test at a time to isolate the issue

## Adding More Tests

To add more tests:

1. Create a new test file in the `tests` directory (e.g., `album.test.ts`)
2. Follow the same pattern as `auth.test.ts`
3. Make sure to clean up any data created during your tests