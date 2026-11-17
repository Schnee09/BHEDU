'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { requestCache } from '@/lib/api/requestCache';

const supabase = getBrowserSupabase();

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace('/dashboard');
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        requestCache.clear();
      }
      if (session) router.replace('/dashboard');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}
