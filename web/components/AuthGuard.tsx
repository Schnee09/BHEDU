// web/components/AuthGuard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

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
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-stone-50 dark:bg-[#0C0B09]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-2 border-amber-500/20 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 w-16 h-16 rounded-2xl border-t-2 border-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-[0.3em] animate-pulse">
            BH-EDU
          </h2>
          <p className="text-[10px] font-bold text-stone-400/60 uppercase tracking-widest">
            Đang xác thực bảo mật...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
