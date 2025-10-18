'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, Bell, User, LogOut, Settings, Check, X } from 'lucide-react';
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
    const icons: { [key: string]: string } = {
      task_assigned: '📋',
      task_completed: '✅',
      task_cancelled: '❌',
      payment_received: '💰',
      new_applicant: '👤',
      application_accepted: '✅',
      application_rejected: '❌',
      task_completion_request: '⏰',
      verification_status: '🔐',
      new_message: '💬',
      system: '🔔',
    };
    return icons[type] || '🔔';
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
            <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">N</span>
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
                  <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 max-h-[500px] overflow-hidden flex flex-col z-[100] animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary-600" />
                        Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-semibold px-3 py-1 rounded-full bg-primary-50 hover:bg-primary-100 transition-all duration-200"
                        >
                          Tandai Semua
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Belum ada notifikasi</p>
                          <p className="text-xs text-gray-500">Notifikasi baru akan muncul di sini</p>
                        </div>
                      ) : (
                        notifications.map((notif, index) => (
                          <div
                            key={notif._id}
                            className={`p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50 hover:to-blue-50 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                              !notif.isRead ? 'bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-l-primary-400' : ''
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
                              <div className="text-2xl flex-shrink-0 p-2 rounded-xl bg-white/50">
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                                    {notif.title}
                                  </h4>
                                  {!notif.isRead && (
                                    <div className="h-3 w-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex-shrink-0 mt-0.5 animate-pulse shadow-lg"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-primary-500 font-medium mt-2">
                                  {getRelativeTime(notif.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 text-center">
                        <Link
                          href="/riwayat"
                          className="text-sm text-primary-600 hover:text-primary-700 font-semibold px-4 py-2 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 inline-flex items-center gap-2 group"
                          onClick={() => setShowNotifications(false)}
                        >
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
                        <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <Link
                        href="/profil"
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl mx-2 group"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
