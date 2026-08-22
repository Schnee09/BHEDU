// web/components/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

import LoadingScreen from '@/components/LoadingScreen';

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        if (!data?.session) {
          router.replace('/login');
        } else {
          setLoading(false);
        }
      }
    };

    // Initial check
    checkSession();

    // Listen for auth changes (e.g. token refresh or login/logout across tabs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      if (session) {
        setLoading(false);
      } else {
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <LoadingScreen message="Đang xác thực bảo mật..." />;
  }

  return <>{children}</>;
}
