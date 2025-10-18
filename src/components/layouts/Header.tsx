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
  Info
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
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center">
            <Image 
              src="/logo/image.png"
              alt="Naro Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold text-gray-900">Naro</span>
        </Link>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
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
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-4 border-b border-gray-100/50 hover:bg-white/70 cursor-pointer transition-all duration-200 ${
                              !notif.isRead ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70' : ''
                            }`}
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
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-medium">
                    {session.user.name?.charAt(0) || 'U'}
                  </div>
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg border z-[100]">
                    <div className="p-4 border-b">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/profil"
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Profil</span>
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="flex w-full items-center space-x-2 px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/login">
              <Button>Masuk</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
