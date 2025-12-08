/**
 * Error handling tests
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleApiError,
} from '@/lib/api/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status', () => {
      const error = new AppError('Test error', 500);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should include code when provided', () => {
      const error = new AppError('Test error', 500, 'TEST_CODE');
      expect(error.code).toBe('TEST_CODE');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create 401 error', () => {
      const error = new AuthenticationError('Not authenticated');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
    });
  });

  describe('AuthorizationError', () => {
    it('should create 403 error', () => {
      const error = new AuthorizationError('Not authorized');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error', () => {
      const error = new RateLimitError('Too many requests');
      expect(error.statusCode).toBe(429);
    });
  });
});

describe('handleApiError', () => {
  it('should handle ValidationError', async () => {
    const error = new ValidationError('Invalid email');
    const response = handleApiError(error);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid email');
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('should handle AuthenticationError', async () => {
    const error = new AuthenticationError('Token expired');
    const response = handleApiError(error);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Token expired');
    expect(body.code).toBe('AUTHENTICATION_ERROR');
  });

  it('should handle AuthorizationError', async () => {
    const error = new AuthorizationError('Insufficient permissions');
    const response = handleApiError(error);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Insufficient permissions');
  });

  it('should handle NotFoundError', async () => {
    const error = new NotFoundError('Student not found');
    const response = handleApiError(error);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Student not found');
  });

  it('should handle ConflictError', async () => {
    const error = new ConflictError('Email already registered');
    const response = handleApiError(error);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('Email already registered');
  });

  it('should handle RateLimitError', async () => {
    const error = new RateLimitError('Rate limit exceeded');
    const response = handleApiError(error);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Rate limit exceeded');
  });

  it('should handle unknown errors as 500', async () => {
    const error = new Error('Unexpected error');
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });

  it('should handle non-Error objects', async () => {
    const response = handleApiError('string error');

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
