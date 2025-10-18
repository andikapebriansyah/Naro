'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Mail, 
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Ban,
  Flag,
  Settings,
  Trash2,
  MoreVertical
} from 'lucide-react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  relatedModel?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export default function NotificationPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      console.log('Session user:', session.user); // Debug log
      fetchNotifications();
    }
  }, [session, filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.set('unreadOnly', 'true');
      }
      params.set('limit', '50');
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();
      
      console.log('Fetched notifications:', data); // Debug log
      
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      
      if (response.ok) {
        // Refresh notifications after marking as read
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      if (response.ok) {
        // Refresh notifications after marking as read
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      task_assigned: <Calendar className="w-5 h-5 text-blue-600" />,
      task_completed: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      task_cancelled: <Ban className="w-5 h-5 text-red-600" />,
      payment_received: <DollarSign className="w-5 h-5 text-emerald-600" />,
      new_applicant: <Users className="w-5 h-5 text-purple-600" />,
      application_accepted: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      application_rejected: <Ban className="w-5 h-5 text-red-600" />,
      task_completion_request: <Clock className="w-5 h-5 text-orange-600" />,
      verification_status: <Settings className="w-5 h-5 text-blue-600" />,
      new_message: <Mail className="w-5 h-5 text-indigo-600" />,
      system: <Info className="w-5 h-5 text-gray-600" />,
    };
    return iconMap[type] || <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white/60 backdrop-blur-sm border-gray-200';
    
    const colorMap: { [key: string]: string } = {
      task_assigned: 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-200/50',
      task_completed: 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-200/50',
      task_cancelled: 'bg-gradient-to-br from-red-50/90 to-rose-50/90 border-red-200/50',
      payment_received: 'bg-gradient-to-br from-emerald-50/90 to-green-50/90 border-emerald-200/50',
      new_applicant: 'bg-gradient-to-br from-purple-50/90 to-violet-50/90 border-purple-200/50',
      application_accepted: 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-200/50',
      application_rejected: 'bg-gradient-to-br from-red-50/90 to-rose-50/90 border-red-200/50',
      task_completion_request: 'bg-gradient-to-br from-orange-50/90 to-amber-50/90 border-orange-200/50',
      verification_status: 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-blue-200/50',
      new_message: 'bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border-indigo-200/50',
      system: 'bg-gradient-to-br from-gray-50/90 to-slate-50/90 border-gray-200/50',
    };
    return colorMap[type] || 'bg-gradient-to-br from-gray-50/90 to-slate-50/90 border-gray-200/50';
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const totalUnreadCount = filter === 'all' ? unreadCount : unreadNotifications.length;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 pb-20">
        <div className="bg-white/90 backdrop-blur-sm border-b sticky top-16 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                Notifikasi
              </h1>
              <div className="flex gap-3">
                {/* Debug button - only in development */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/notifications/test', { method: 'POST' });
                        if (response.ok) {
                          await fetchNotifications();
                        }
                      } catch (error) {
                        console.error('Failed to create test notifications:', error);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Bell className="w-4 h-4" />
                    Test Notif
                  </button>
                )}
                {totalUnreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-3 px-5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]' 
                    : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white/90 hover:shadow-md border border-gray-200'
                }`}
              >
                <Bell size={18} />
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 py-3 px-5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  filter === 'unread' 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/25 transform scale-[1.02]' 
                    : 'bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white/90 hover:shadow-md border border-gray-200'
                }`}
              >
                <AlertCircle size={18} />
                Belum Dibaca ({totalUnreadCount})
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 animate-slide-up">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Memuat notifikasi...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center animate-card-pop">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] animate-card-pop p-6 ${getNotificationBgColor(notification.type, notification.isRead)}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold text-lg ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          )}
                          <span className={`text-xs font-medium ${
                            notification.isRead ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {getRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>

                      <p className={`text-sm leading-relaxed ${
                        notification.isRead ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>

                      {notification.relatedId && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                            Lihat Detail →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}