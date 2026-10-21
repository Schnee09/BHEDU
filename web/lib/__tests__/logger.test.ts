import { sanitizeLogMetadata } from '../logger';

describe('logger metadata sanitization', () => {
  it('redacts credentials recursively', () => {
    expect(
      sanitizeLogMetadata({
        password: 'secret-password',
        nested: {
          authorization: 'Bearer abc.def.ghi',
          api_key: 'secret-api-key',
        },
      })
    ).toEqual({
      password: '[REDACTED]',
      nested: {
        authorization: '[REDACTED]',
        api_key: '[REDACTED]',
      },
    });
  });

  it('masks email addresses and bearer tokens embedded in text', () => {
    expect(
      sanitizeLogMetadata({
        userEmail: 'teacher@example.edu',
        message: 'Request used Bearer abc.def.ghi',
      })
    ).toEqual({
      userEmail: 't***@example.edu',
      message: 'Request used Bearer [REDACTED]',
    });
  });

  it('handles circular metadata safely', () => {
    const metadata: Record<string, unknown> = {};
    metadata.self = metadata;

    expect(sanitizeLogMetadata(metadata)).toEqual({ self: '[Circular]' });
  });
});
