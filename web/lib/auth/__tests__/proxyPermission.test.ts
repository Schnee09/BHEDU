import { resolveProxyPermission } from '../proxyPermission';

function client(data: boolean | null, error: unknown = null) {
  return {
    rpc: jest.fn().mockResolvedValue({ data, error }),
  };
}

describe('resolveProxyPermission', () => {
  it('uses a dynamic database grant for custom and staff roles', async () => {
    const supabase = client(true);

    await expect(
      resolveProxyPermission(supabase, 'staff-1', 'staff', 'students.view')
    ).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('user_has_permission', {
      p_user_id: 'staff-1',
      p_permission_code: 'students.view',
    });
  });

  it('honors a dynamic database denial over code defaults', async () => {
    const supabase = client(false);

    await expect(
      resolveProxyPermission(supabase, 'admin-1', 'admin', 'students.view')
    ).resolves.toBe(false);
  });

  it('falls back to code defaults when the RPC is unavailable', async () => {
    const supabase = client(null, new Error('RPC unavailable'));

    await expect(
      resolveProxyPermission(supabase, 'owner-1', 'owner', 'finance.view')
    ).resolves.toBe(true);
  });

  it('keeps the super-admin safety override without a database call', async () => {
    const supabase = client(false);

    await expect(
      resolveProxyPermission(supabase, 'root-1', 'super_admin', 'system.settings')
    ).resolves.toBe(true);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
