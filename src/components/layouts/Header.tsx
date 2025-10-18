'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Check, 
  X, 
  Calendar,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Clock,
  Shield,
  MessageSquare,
  Info,
  LayoutDashboard,
  UserCircle2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export function Header() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      task_assigned: <Calendar className="w-4 h-4 text-blue-600" />,
      task_completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      task_cancelled: <XCircle className="w-4 h-4 text-red-600" />,
      payment_received: <DollarSign className="w-4 h-4 text-emerald-600" />,
      new_applicant: <Users className="w-4 h-4 text-purple-600" />,
      application_accepted: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      application_rejected: <XCircle className="w-4 h-4 text-red-600" />,
      task_completion_request: <Clock className="w-4 h-4 text-orange-600" />,
      verification_status: <Shield className="w-4 h-4 text-blue-600" />,
      new_message: <MessageSquare className="w-4 h-4 text-indigo-600" />,
      system: <Info className="w-4 h-4 text-gray-600" />,
    };
    return iconMap[type] || <Bell className="w-4 h-4 text-gray-600" />;
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    return new Date(date).toLocaleDateString('id-ID');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-200/20">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo/image.png"
                alt="Naro Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Naro
              </h1>
              <p className="text-xs text-gray-500">Platform Kerja Terpercaya</p>
            </div>
          </div>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-gray-100/80 transition-all duration-200 hover:scale-105 rounded-xl"
                >
                  <Bell className="h-5 w-5 text-gray-600 hover:text-primary-600 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 max-h-[500px] overflow-hidden flex flex-col z-[100] animate-slide-down">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold bg-white/70 hover:bg-white/90 px-3 py-2 rounded-lg transition-all duration-200 shadow-sm"
                        >
                          <Check className="w-3 h-3 inline mr-1" />
                          Tandai Dibaca
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium">Belum ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.map((notif, index) => (
                          <div
                            key={notif._id}
                            className={`p-4 border-b border-gray-100/50 hover:bg-white/70 cursor-pointer transition-all duration-200 ${
                              !notif.isRead ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70' : ''
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => {
                              if (!notif.isRead) markAsRead(notif._id);
                              if (notif.relatedId) {
                                setShowNotifications(false);
                                window.location.href = `/tugas/${notif.relatedId}`;
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                !notif.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'
                              }`}>
                                <div className="text-lg">
                                  {getNotificationIcon(notif.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`font-semibold text-sm line-clamp-1 ${
                                    !notif.isRead ? 'text-gray-900' : 'text-gray-600'
                                  }`}>
                                    {notif.title}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notif.isRead && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    )}
                                    <span className="text-xs text-gray-400 font-medium">
                                      {getRelativeTime(notif.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/80 text-center">
                        <Link
                          href="/notifikasi"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold bg-white/70 hover:bg-white/90 px-4 py-3 rounded-xl transition-all duration-200 shadow-sm"
                          onClick={() => setShowNotifications(false)}
                        >
                          <Bell className="w-4 h-4" />
                          Lihat Semua Notifikasi
                          <Bell className="h-3 w-3 group-hover:scale-110 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 rounded-2xl p-2 hover:bg-gray-100/80 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <p className="font-bold text-gray-900">{session.user.name}</p>
                      <p className="text-sm text-gray-600">{session.user.email}</p>
                      {session.user.isVerified && (
                        <div className="flex items-center gap-1 mt-2">
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Terverifikasi</span>
                        </div>
                      )}
                    </div>
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl mx-2 group"
                        onClick={() => setShowMenu(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <Link
                        href="/profil"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl mx-2 group"
                        onClick={() => setShowMenu(false)}
                      >
                        <UserCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Profil</span>
                      </Link>
                      <div className="mx-2 my-1 border-t border-gray-100"></div>
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl mx-2 group"
                      >
                        <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/login">
              <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-ripple overflow-hidden relative group">
                <span className="relative z-10">Masuk</span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
    </header>
  );
}
