/**
 * API response helper tests
 */

import {
  success,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  paginated,
} from '@/lib/api/responses';

describe('API Response Helpers', () => {
  describe('success', () => {
    it('should return 200 success response', async () => {
      const data = { id: 1, name: 'Test' };
      const response = success(data);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('should include optional message', async () => {
      const response = success({ id: 1 }, 'Operation completed');

      const body = await response.json();
      expect(body.message).toBe('Operation completed');
    });
  });

  describe('created', () => {
    it('should return 201 created response', async () => {
      const data = { id: 1, name: 'New Item' };
      const response = created(data);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.message).toBe('Resource created successfully');
    });
  });

  describe('noContent', () => {
    it('should return 204 no content response', () => {
      const response = noContent();

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe('badRequest', () => {
    it('should return 400 bad request response', async () => {
      const response = badRequest('Invalid input');

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('unauthorized', () => {
    it('should return 401 unauthorized response', async () => {
      const response = unauthorized();

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('forbidden', () => {
    it('should return 403 forbidden response', async () => {
      const response = forbidden('Access denied');

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Access denied');
    });
  });

  describe('notFound', () => {
    it('should return 404 not found response', async () => {
      const response = notFound('Course not found');

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Course not found');
    });
  });

  describe('conflict', () => {
    it('should return 409 conflict response', async () => {
      const response = conflict('Resource already exists');

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Resource already exists');
    });
  });

  describe('serverError', () => {
    it('should return 500 server error response', async () => {
      const response = serverError('Database error');

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Database error');
    });
  });

  describe('paginated', () => {
    it('should return paginated response with metadata', async () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const response = paginated(data, 1, 20, 42);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 42,
        totalPages: 3,
      });
    });

    it('should calculate total pages correctly', async () => {
      const response = paginated([], 1, 10, 25);

      const body = await response.json();
      expect(body.pagination?.totalPages).toBe(3);
    });
  });
});
