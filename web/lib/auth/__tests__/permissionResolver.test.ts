import { createServiceClient } from '@/lib/supabase/server';
import {
  getEffectivePermissions,
  getEffectiveRolePermissions,
  resolveServerPermission,
} from '@/lib/auth/permissionResolver';

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(),
}));

const mockCreateServiceClient = jest.mocked(createServiceClient);

function singleQuery(data: unknown) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  return query;
}

describe('permissionResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('grants a permission assigned through database role defaults', async () => {
    const queries = {
      user_permissions: singleQuery(null),
      role_permission_overrides: singleQuery(null),
      role_permissions: singleQuery({ permission_code: 'finance.view' }),
    };
    mockCreateServiceClient.mockReturnValue({
      from: jest.fn((table: keyof typeof queries) => queries[table]),
    } as unknown as ReturnType<typeof createServiceClient>);

    await expect(resolveServerPermission('staff-1', 'staff', 'finance.view')).resolves.toBe(true);
  });

  it('keeps an explicit role denial above a database role default', async () => {
    const queries = {
      user_permissions: singleQuery(null),
      role_permission_overrides: singleQuery({ is_denied: true }),
      role_permissions: singleQuery({ permission_code: 'finance.view' }),
    };
    const from = jest.fn((table: keyof typeof queries) => queries[table]);
    mockCreateServiceClient.mockReturnValue({ from } as unknown as ReturnType<
      typeof createServiceClient
    >);

    await expect(resolveServerPermission('staff-1', 'staff', 'finance.view')).resolves.toBe(false);
    expect(from).not.toHaveBeenCalledWith('role_permissions');
  });

  it('includes database role defaults in the effective permission set', async () => {
    const roleDefaults = {
      select: jest.fn(),
      eq: jest.fn().mockResolvedValue({
        data: [{ permission_code: 'finance.view' }, { permission_code: 'students.view' }],
      }),
    };
    roleDefaults.select.mockReturnValue(roleDefaults);

    const roleOverrides = {
      select: jest.fn(),
      eq: jest.fn().mockResolvedValue({ data: [] }),
    };
    roleOverrides.select.mockReturnValue(roleOverrides);

    const userOverrides = {
      select: jest.fn(),
      eq: jest.fn(),
      or: jest.fn().mockResolvedValue({ data: [] }),
    };
    userOverrides.select.mockReturnValue(userOverrides);
    userOverrides.eq.mockReturnValue(userOverrides);

    mockCreateServiceClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'role_permissions') return roleDefaults;
        if (table === 'role_permission_overrides') return roleOverrides;
        return userOverrides;
      }),
    } as unknown as ReturnType<typeof createServiceClient>);

    const result = await getEffectivePermissions('staff-1', 'staff');

    expect(result.granted.has('finance.view')).toBe(true);
    expect(result.granted.has('students.view')).toBe(true);
  });

  it('resolves database defaults and overrides when inspecting a role', async () => {
    const queries = {
      role_permissions: {
        data: [{ permission_code: 'finance.view' }, { permission_code: 'students.view' }],
      },
      role_permission_overrides: {
        data: [
          { permission_code: 'finance.view', is_denied: true },
          { permission_code: 'reports.view', is_denied: false },
        ],
      },
    };
    const from = jest.fn((table: keyof typeof queries) => {
      const query = {
        select: jest.fn(),
        eq: jest.fn().mockResolvedValue(queries[table]),
      };
      query.select.mockReturnValue(query);
      return query;
    });
    mockCreateServiceClient.mockReturnValue({ from } as unknown as ReturnType<
      typeof createServiceClient
    >);

    const result = await getEffectiveRolePermissions('staff');

    expect(result.granted.has('students.view')).toBe(true);
    expect(result.granted.has('reports.view')).toBe(true);
    expect(result.granted.has('finance.view')).toBe(false);
    expect(result.denied.has('finance.view')).toBe(true);
  });
});
