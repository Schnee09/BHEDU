import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user from session
    const authSupabase = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // 2. Parse file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Vui lòng chọn định dạng file ảnh hợp lệ' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dung lượng ảnh tối đa là 5MB' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // 3. Ensure 'avatars' bucket exists in Supabase Storage
    try {
      const { data: buckets } = await serviceSupabase.storage.listBuckets();
      const hasAvatarBucket = buckets?.some((b) => b.name === 'avatars');
      if (!hasAvatarBucket) {
        await serviceSupabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
      }
    } catch (bucketErr: any) {
      logger.warn('Bucket verification warning:', { error: bucketErr?.message || String(bucketErr) });
    }

    // 4. Fetch current profile to get old photo for cleanup
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id, user_id, photo_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await serviceSupabase
        .from('profiles')
        .select('id, user_id, photo_url')
        .eq('id', user.id)
        .maybeSingle();
      profile = fallback.data;
    }

    const profileId = profile?.id || user.id;
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `profiles/profile-${profileId}-${Date.now()}.${ext}`;

    // 5. Convert file to buffer and upload via admin service client
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await serviceSupabase.storage
      .from('avatars')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase storage upload error:', { error: uploadError.message });
      return NextResponse.json(
        { error: `Lỗi tải ảnh lên Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Get public URL
    const { data: urlData } = serviceSupabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 7. Update database record
    const updatePayload = {
      photo_url: publicUrl,
      updated_at: new Date().toISOString(),
    };

    let { data: updated, error: dbErr } = await serviceSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select('id, user_id, photo_url')
      .maybeSingle();

    if (!updated && !dbErr) {
      const fb = await serviceSupabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select('id, user_id, photo_url')
        .maybeSingle();
      updated = fb.data;
      dbErr = fb.error;
    }

    if (dbErr) {
      logger.error('Database update error in avatar upload:', { error: dbErr.message });
      return NextResponse.json({ error: `Lỗi cập nhật CSDL: ${dbErr.message}` }, { status: 500 });
    }

    // Sync auth user_metadata
    try {
      await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { photo_url: publicUrl, avatar_url: publicUrl },
      });
    } catch (metaErr) {
      logger.warn('Failed to sync auth user_metadata:', { error: String(metaErr) });
    }

    // 8. Cleanup old avatar if it was on Supabase Storage
    if (profile?.photo_url && profile.photo_url.includes('avatars/profiles/')) {
      try {
        const oldRelPath = profile.photo_url.split('avatars/')[1];
        if (oldRelPath && oldRelPath !== filePath) {
          await serviceSupabase.storage.from('avatars').remove([oldRelPath]);
        }
      } catch (cleanErr: any) {
        logger.warn('Failed to cleanup old avatar file:', { error: cleanErr?.message || String(cleanErr) });
      }
    }

    return NextResponse.json({
      success: true,
      photo_url: publicUrl,
    });
  } catch (error: any) {
    logger.error('Unexpected error in POST /api/profile/avatar:', { error: error?.message || String(error) });
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý tải ảnh đại diện' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate user from session
    const authSupabase = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập. Vui lòng đăng nhập lại.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const serviceSupabase = createServiceClient();

    // 2. Fetch current profile
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id, user_id, photo_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await serviceSupabase
        .from('profiles')
        .select('id, user_id, photo_url')
        .eq('id', user.id)
        .maybeSingle();
      profile = fallback.data;
    }

    if (profile?.photo_url && profile.photo_url.includes('avatars/profiles/')) {
      try {
        const oldRelPath = profile.photo_url.split('avatars/')[1];
        if (oldRelPath) {
          await serviceSupabase.storage.from('avatars').remove([oldRelPath]);
        }
      } catch (cleanErr: any) {
        logger.warn('Failed to delete avatar from storage:', { error: cleanErr?.message || String(cleanErr) });
      }
    }

    // 3. Clear database field
    const updatePayload = {
      photo_url: null,
      updated_at: new Date().toISOString(),
    };

    let { data: updated, error: dbErr } = await serviceSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select('id, user_id, photo_url')
      .maybeSingle();

    if (!updated && !dbErr) {
      const fb = await serviceSupabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select('id, user_id, photo_url')
        .maybeSingle();
      updated = fb.data;
      dbErr = fb.error;
    }

    if (dbErr) {
      logger.error('Database update error in avatar delete:', { error: dbErr.message });
      return NextResponse.json({ error: `Lỗi cập nhật CSDL: ${dbErr.message}` }, { status: 500 });
    }

    // Clear auth user_metadata
    try {
      await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { photo_url: null, avatar_url: null },
      });
    } catch (metaErr) {
      logger.warn('Failed to clear auth user_metadata:', { error: String(metaErr) });
    }

    return NextResponse.json({
      success: true,
      photo_url: null,
    });
  } catch (error: any) {
    logger.error('Unexpected error in DELETE /api/profile/avatar:', { error: error?.message || String(error) });
    return NextResponse.json(
      { error: error.message || 'Lỗi khi gỡ ảnh đại diện' },
      { status: 500 }
    );
  }
}
