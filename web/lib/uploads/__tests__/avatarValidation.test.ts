import { getAvatarExtension, hasValidImageSignature } from '@/lib/uploads/avatarValidation';

describe('avatar validation', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('maps %s to a server-controlled extension', (mimeType, extension) => {
    expect(getAvatarExtension(mimeType)).toBe(extension);
  });

  it.each(['image/svg+xml', 'image/gif', 'text/html', 'application/octet-stream'])(
    'rejects unsupported MIME type %s',
    (mimeType) => {
      expect(getAvatarExtension(mimeType)).toBeUndefined();
      expect(hasValidImageSignature(new Uint8Array(16), mimeType)).toBe(false);
    }
  );

  it('validates JPEG, PNG and WebP signatures', () => {
    expect(hasValidImageSignature(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg')).toBe(true);
    expect(
      hasValidImageSignature(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'image/png'
      )
    ).toBe(true);
    expect(
      hasValidImageSignature(
        new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]),
        'image/webp'
      )
    ).toBe(true);
  });

  it('rejects a spoofed MIME type', () => {
    const html = new TextEncoder().encode('<script>alert(1)</script>');
    expect(hasValidImageSignature(html, 'image/png')).toBe(false);
  });
});
