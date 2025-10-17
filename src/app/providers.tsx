'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toaster';
import { useUserNameSync } from '@/lib/hooks/useUserNameSync';

function UserNameSyncProvider({ children }: { children: ReactNode }) {
  useUserNameSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserNameSyncProvider>
        {children}
      </UserNameSyncProvider>
      <ToastProvider />
    </SessionProvider>
  );
}
