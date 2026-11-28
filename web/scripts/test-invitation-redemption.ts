import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedProject = 'mwncwhkdimnjovxzhtjm';

if (process.env.ALLOW_PRODUCTION_E2E !== '1') {
  throw new Error('Set ALLOW_PRODUCTION_E2E=1 to run this production mutation test.');
}
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('Supabase URL, anon key, and service role key are required.');
}
if (!url.includes(expectedProject)) {
  throw new Error(`Refusing to run against an unexpected Supabase project: ${url}`);
}

const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = `BhE2e!${randomUUID()}aA1`;
const authUserIds = new Set<string>();
const invitationIds = new Set<string>();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function createInvitation(input: {
  email?: string;
  phone?: string;
  role: string;
  expired?: boolean;
}) {
  const token = randomUUID();
  const now = Date.now();
  const { data, error } = await service
    .from('user_invitations')
    .insert({
      email: input.email || null,
      phone: input.phone || null,
      role: input.role,
      token,
      invited_by: await getInviterId(),
      created_at: input.expired ? new Date(now - 120_000).toISOString() : undefined,
      expires_at: new Date(now + (input.expired ? -60_000 : 3_600_000)).toISOString(),
      metadata: { e2e_run_id: runId },
    })
    .select('id, token')
    .single();

  if (error || !data) throw new Error(`Cannot create test invitation: ${error?.message}`);
  invitationIds.add(data.id);
  return data;
}

let inviterId: string | null = null;
async function getInviterId() {
  if (inviterId) return inviterId;
  const { data, error } = await service
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'owner', 'admin'])
    .eq('is_active', true)
    .limit(1)
    .single();
  if (error || !data) throw new Error(`Cannot find an inviter profile: ${error?.message}`);
  inviterId = data.id;
  return inviterId;
}

async function signUp(email: string, metadata: Record<string, unknown>) {
  const result = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { provisioned_by_admin: false },
    user_metadata: { full_name: 'Kiểm thử lời mời', ...metadata },
  });
  if (result.data.user) authUserIds.add(result.data.user.id);
  return result;
}

async function profileFor(userId: string) {
  let lastError: string | undefined;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await service
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return data;
    lastError = error?.message;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Cannot read test profile after retry: ${lastError || 'profile not found'}`);
}

async function cleanup() {
  const failures: string[] = [];
  if (invitationIds.size > 0) {
    const { error } = await service
      .from('user_invitations')
      .delete()
      .in('id', [...invitationIds]);
    if (error) failures.push(`invitations: ${error.message}`);
  }

  if (authUserIds.size > 0) {
    const ids = [...authUserIds];
    const { error } = await service.from('profiles').delete().in('user_id', ids);
    if (error) failures.push(`profiles: ${error.message}`);
    for (const id of ids) {
      const { error: authError } = await service.auth.admin.deleteUser(id);
      if (authError) failures.push(`auth user ${id}: ${authError.message}`);
    }
  }

  if (invitationIds.size > 0) {
    const { count, error } = await service
      .from('user_invitations')
      .select('id', { count: 'exact', head: true })
      .in('id', [...invitationIds]);
    if (error) failures.push(`invitation check: ${error.message}`);
    if (count) failures.push(`${count} test invitation(s) remain`);
  }

  if (authUserIds.size > 0) {
    const { count, error } = await service
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('user_id', [...authUserIds]);
    if (error) failures.push(`profile check: ${error.message}`);
    if (count) failures.push(`${count} test profile(s) remain`);
  }

  if (failures.length > 0) {
    throw new Error(`Production E2E cleanup failed: ${failures.join('; ')}`);
  }
  console.log('PASS: temporary production data was removed');
}

async function main() {
  try {
    const phone = `09${String(Date.now()).slice(-8)}`;
    const validInvite = await createInvitation({ phone, role: 'admin' });
    const invitedEmail = `e2e-invite-${runId}@bhedu.vn`;
    const invitedSignup = await signUp(invitedEmail, {
      phone: `+84${phone.slice(1)}`,
      role: 'super_admin',
      invite_token: validInvite.token,
    });
    assert(
      !invitedSignup.error && invitedSignup.data.user,
      `Valid invitation signup failed: ${invitedSignup.error?.message || 'user was not created'}`
    );
    const invitedProfile = await profileFor(invitedSignup.data.user.id);
    assert(invitedProfile.role === 'admin', 'Invitation role was not enforced by the database.');

    const { data: redeemed } = await service
      .from('user_invitations')
      .select('used_at, used_by')
      .eq('id', validInvite.id)
      .single();
    assert(
      redeemed?.used_at && redeemed.used_by === invitedProfile.id,
      'Invitation was not redeemed.'
    );
    console.log('PASS: valid invitation enforces its role and is redeemed');

    const reusedSignup = await signUp(`e2e-reuse-${runId}@bhedu.vn`, {
      phone: `+84${phone.slice(1)}`,
      role: 'teacher',
      invite_token: validInvite.token,
    });
    assert(reusedSignup.error, 'A redeemed invitation was accepted a second time.');
    console.log('PASS: redeemed invitation cannot be reused');

    const expectedEmail = `e2e-expected-${runId}@bhedu.vn`;
    const mismatchInvite = await createInvitation({ email: expectedEmail, role: 'teacher' });
    const mismatchSignup = await signUp(`e2e-mismatch-${runId}@bhedu.vn`, {
      role: 'teacher',
      invite_token: mismatchInvite.token,
    });
    assert(mismatchSignup.error, 'An invitation accepted a mismatched email address.');
    console.log('PASS: invitation rejects a mismatched contact');

    const expiredEmail = `e2e-expired-${runId}@bhedu.vn`;
    const expiredInvite = await createInvitation({
      email: expiredEmail,
      role: 'teacher',
      expired: true,
    });
    const expiredSignup = await signUp(expiredEmail, {
      role: 'teacher',
      invite_token: expiredInvite.token,
    });
    assert(expiredSignup.error, 'An expired invitation was accepted.');
    console.log('PASS: expired invitation is rejected');

    const publicSignup = await signUp(`e2e-public-${runId}@bhedu.vn`, {
      role: 'super_admin',
    });
    assert(
      !publicSignup.error && publicSignup.data.user,
      `Public parent signup failed: ${publicSignup.error?.message || 'user was not created'}`
    );
    const publicProfile = await profileFor(publicSignup.data.user.id);
    assert(publicProfile.role === 'parent', 'Public signup escalated its role from user metadata.');
    console.log('PASS: public signup cannot elevate its role');
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
