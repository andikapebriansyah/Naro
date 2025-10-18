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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-2xl"></div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent pointer-events-none"></div>
      
      <div className="relative flex items-center justify-around h-20 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCreateButton = item.href === '/tugas/buat';
          const isDisabled = isCreateButton && !canCreateTask;

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative',
                  'text-gray-300 cursor-not-allowed'
                )}
              >
                <div className="flex flex-col items-center space-y-1 p-2">
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    <div className="absolute inset-0 bg-gray-200 rounded-full opacity-30"></div>
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </div>
            );
          }

          if (isCreateButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                <div className="flex flex-col items-center space-y-1">
                  {/* Special design for create button */}
                  <div className="relative nav-glow">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 btn-ripple overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-primary-200 animate-float" 
                        : "bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 shadow-primary-100 group-hover:shadow-primary-200 group-hover:shadow-xl"
                    )}>
                      <Icon className={cn(
                        "h-7 w-7 text-white transition-transform duration-300 z-10 relative",
                        "group-hover:scale-110 group-hover:rotate-90"
                      )} />
                      
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Sparkle effects */}
                      <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse"></div>
                      <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-3 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
                      
                      {/* Orbital glow */}
                      <div className="absolute inset-0 rounded-2xl animate-spin-slow opacity-30">
                        <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2"></div>
                      </div>
                    </div>
                    
                    {/* Enhanced floating indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse shadow-lg"></div>
                    )}
                    
                    {/* Multi-layer ripple effect */}
                    <div className="absolute inset-0 rounded-2xl bg-primary-400 opacity-0 group-hover:opacity-15 scale-0 group-hover:scale-150 transition-all duration-500"></div>
                    <div className="absolute inset-0 rounded-2xl bg-primary-300 opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-125 transition-all duration-300 delay-100"></div>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold transition-all duration-300",
                    isActive ? "text-primary-600" : "text-gray-600 group-hover:text-primary-500 group-hover:scale-105"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
            >
              <div className="flex flex-col items-center space-y-2 p-2">
                {/* Icon container */}
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1",
                    isActive 
                      ? "bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 shadow-lg shadow-primary-200/50" 
                      : "text-gray-500 group-hover:bg-gradient-to-br group-hover:from-gray-50 group-hover:to-gray-100 group-hover:text-primary-500 group-hover:shadow-md"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    
                    {/* Shine effect */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent"></div>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-sm"></div>
                  )}
                  
                  {/* Hover ripple effect */}
                  <div className="absolute inset-0 rounded-2xl bg-primary-400 opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-125 transition-all duration-400"></div>
                  
                  {/* Notification dot for specific items */}
                  {(item.href === '/riwayat' || item.href === '/profil') && Math.random() > 0.7 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-notification-pulse shadow-sm"></div>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive ? "text-primary-600 font-semibold" : "text-gray-500 group-hover:text-primary-500 group-hover:scale-105"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
