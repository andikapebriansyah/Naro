'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, Plus, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Beranda' },
  { href: '/pekerja', icon: Search, label: 'Cari' },
  { href: '/tugas/buat', icon: Plus, label: 'Buat' },
  { href: '/riwayat', icon: FileText, label: 'Riwayat' },
  { href: '/profil', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { canCreateTasks } = useProfileValidation();

  // Check if user can create tasks (verified + basic profile complete)
  const canCreateTask = canCreateTasks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCreateButton = item.href === '/tugas/buat';
          const isDisabled = isCreateButton && !canCreateTask;

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full space-y-1',
                  'text-gray-400 cursor-not-allowed opacity-50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1',
                isActive ? 'text-primary-600' : 'text-gray-600'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
