import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAvatarExtension, hasValidImageSignature } from '@/lib/uploads/avatarValidation';

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
        { error: 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // 2. Parse file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp ảnh tải lên.' }, { status: 400 });
    }

    const extension = getAvatarExtension(file.type);
    if (!extension) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dung lượng ảnh tối đa là 5 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    if (!hasValidImageSignature(fileBytes, file.type)) {
      return NextResponse.json({ error: 'Nội dung tệp ảnh không hợp lệ.' }, { status: 400 });
    }

    const serviceSupabase = createServiceClient();

    // 3. Fetch current profile to get old photo for cleanup
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
    const filePath = `profiles/profile-${profileId}-${Date.now()}.${extension}`;

    // 4. Convert file to buffer and upload via admin service client
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
        { error: 'Không thể tải ảnh lên. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // 5. Get public URL
    const { data: urlData } = serviceSupabase.storage.from('avatars').getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 6. Update database record
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

    if (!updated && !dbErr) {
      const { error: rollbackError } = await serviceSupabase.storage
        .from('avatars')
        .remove([filePath]);
      if (rollbackError) {
        logger.warn('Failed to rollback uploaded avatar:', { error: rollbackError.message });
      }
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ để cập nhật.' }, { status: 500 });
    }

    if (dbErr) {
      const { error: rollbackError } = await serviceSupabase.storage
        .from('avatars')
        .remove([filePath]);
      if (rollbackError) {
        logger.warn('Failed to rollback uploaded avatar:', { error: rollbackError.message });
      }
      logger.error('Database update error in avatar upload:', { error: dbErr.message });
      return NextResponse.json({ error: 'Không thể cập nhật ảnh đại diện.' }, { status: 500 });
    }

    // Sync auth user_metadata
    try {
      const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { photo_url: publicUrl, avatar_url: publicUrl },
      });
      if (metadataError) {
        logger.warn('Failed to sync auth user_metadata:', { error: metadataError.message });
      }
    } catch (metaErr) {
      logger.warn('Failed to sync auth user_metadata:', { error: String(metaErr) });
    }

    // 7. Cleanup old avatar if it was on Supabase Storage
    if (profile?.photo_url && profile.photo_url.includes('avatars/profiles/')) {
      try {
        const oldRelPath = profile.photo_url.split('avatars/')[1];
        if (oldRelPath && oldRelPath !== filePath) {
          await serviceSupabase.storage.from('avatars').remove([oldRelPath]);
        }
      } catch (cleanErr: any) {
        logger.warn('Failed to cleanup old avatar file:', {
          error: cleanErr?.message || String(cleanErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      photo_url: publicUrl,
    });
  } catch (error: any) {
    logger.error('Unexpected error in POST /api/profile/avatar:', {
      error: error?.message || String(error),
    });
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu tải ảnh đại diện.' },
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
        { error: 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', code: 'UNAUTHENTICATED' },
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
      return NextResponse.json({ error: 'Không thể cập nhật ảnh đại diện.' }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ để cập nhật.' }, { status: 500 });
    }

    // 4. Remove the old file only after the database no longer references it
    if (profile?.photo_url && profile.photo_url.includes('avatars/profiles/')) {
      try {
        const oldRelPath = profile.photo_url.split('avatars/')[1];
        if (oldRelPath) {
          const { error: removeError } = await serviceSupabase.storage
            .from('avatars')
            .remove([oldRelPath]);
          if (removeError) {
            logger.warn('Failed to delete avatar from storage:', { error: removeError.message });
          }
        }
      } catch (cleanErr: any) {
        logger.warn('Failed to delete avatar from storage:', {
          error: cleanErr?.message || String(cleanErr),
        });
      }
    }

    // Clear auth user_metadata
    try {
      const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: { photo_url: null, avatar_url: null },
      });
      if (metadataError) {
        logger.warn('Failed to clear auth user_metadata:', { error: metadataError.message });
      }
    } catch (metaErr) {
      logger.warn('Failed to clear auth user_metadata:', { error: String(metaErr) });
    }

    return NextResponse.json({
      success: true,
      photo_url: null,
    });
  } catch (error: any) {
    logger.error('Unexpected error in DELETE /api/profile/avatar:', {
      error: error?.message || String(error),
    });
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu gỡ ảnh đại diện.' },
      { status: 500 }
    );
  }
}
