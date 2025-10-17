// src/app/riwayat/page.tsx - COMPLETE UPDATE

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  calculateTaskProgress,
  formatDuration
} from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Briefcase, UserCheck, Edit, Trash2, MessageCircle, Phone, AlertCircle } from 'lucide-react';
import { CancelTaskModal } from '@/components/features/tasks/CancelTaskModal';
import { ReportTaskModal } from '@/components/features/tasks/ReportTaskModal';
import { toast } from 'sonner';

type TabType = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'reported';
type ModeType = 'worker' | 'employer';

interface TaskData {
  _id: string;
  title: string;
  category: string;
  location: string;
  scheduledDate: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  estimatedDuration?: string;
  budget: number;
  status: string;
  applicationStatus?: string;
  isAssignedWorker?: boolean;
  poster?: {
    _id: string;
    name: string;
    phone?: string;
    rating?: number;
  };
  assignedTo?: {
    _id: string;
    name: string;
    phone?: string;
    rating?: number;
  };
  report?: {
    status: 'resolved' | 'rejected';
    resolution?: string;
    adminNotes?: string;
    reporterType: 'worker' | 'employer';
    resolvedAt?: string;
    action?: 'warning' | 'suspend_reported' | 'refund' | 'no_action';
  } | null;
}

const getProgressMessage = (progress: any) => {
  switch (progress.status) {
    case 'not_started':
      return `Dimulai dalam ${formatDuration(progress.remainingHours, progress.remainingMinutes)}`;
    case 'in_progress':
      return `${formatDuration(progress.remainingHours, progress.remainingMinutes)} tersisa`;
    case 'finished':
      return 'Pekerjaan seharusnya sudah selesai';
    case 'invalid':
      return 'Jadwal tidak lengkap';
    default:
      return 'Status tidak valid';
  }
};

const getTabStatusText = (tab: TabType): string => {
  const textMap: Record<TabType, string> = {
    pending: 'Pending',
    in_progress: 'Proses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    reported: 'Dilaporkan',
  };
  return textMap[tab];
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') as ModeType;

  const [mode, setMode] = useState<ModeType>(modeParam || 'worker');
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
  });
  const [isCancelling, setIsCancelling] = useState(false);

  // Report Modal State
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    userType: 'worker' | 'employer';
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    userType: 'employer',
  });
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session, activeTab, mode]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/api/worker-jobs';

      if (mode === 'employer') {
        endpoint = '/api/my-tasks';
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      console.log(`History API response (${mode} mode):`, data);

      if (data.success) {
        let filteredTasks = data.data;

        if (mode === 'employer') {
          switch (activeTab) {
            case 'pending':
              filteredTasks = data.data.filter((task: any) =>
                task.status === 'open' || task.status === 'pending' || (task.status === 'completed_worker' && task.assignedTo !== null)
              );
              break;
            case 'in_progress':
              filteredTasks = data.data.filter((task: any) =>
                ['accepted', 'active', 'proses'].includes(task.status) && task.assignedTo !== null
              );
              break;
            case 'completed':
              filteredTasks = data.data.filter((task: any) =>
                task.status === 'selesai' || task.status === 'completed'
              );
              break;
            case 'cancelled':
              filteredTasks = data.data.filter((task: any) =>
                task.status === 'dibatalkan' || task.status === 'cancelled'
              );
              break;
            case 'reported':
              filteredTasks = data.data.filter((task: any) =>
                task.status === 'disputed'
              );
              break;
          }
        } else {
          switch (activeTab) {
            case 'pending':
              filteredTasks = data.data.filter((task: any) =>
                task.applicationStatus === 'pending' || 
                (task.isAssignedWorker && task.status === 'completed_worker')
              );
              break;
            case 'in_progress':
              filteredTasks = data.data.filter((task: any) =>
                (task.isAssignedWorker && ['accepted', 'active', 'proses'].includes(task.status)) ||
                (task.applicationStatus === 'accepted' && ['accepted', 'active', 'proses'].includes(task.status))
              );
              break;
            case 'completed':
              filteredTasks = data.data.filter((task: any) =>
                (task.isAssignedWorker && ['completed', 'selesai'].includes(task.status)) ||
                (task.applicationStatus === 'accepted' && ['completed', 'selesai'].includes(task.status))
              );
              break;
            case 'cancelled':
              filteredTasks = data.data.filter((task: any) =>
                task.applicationStatus === 'rejected' ||
                ['cancelled', 'dibatalkan'].includes(task.status)
              );
              break;
            case 'reported':
              filteredTasks = data.data.filter((task: any) =>
                task.status === 'disputed'
              );
              break;
          }
        }

        setTasks(filteredTasks);
      } else {
        console.error(`Failed to fetch ${mode} tasks:`, data.error);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { value: TabType; label: string; icon: any }[] = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'in_progress', label: 'Proses', icon: Clock },
    { value: 'completed', label: 'Selesai', icon: CheckCircle },
    { value: 'cancelled', label: 'Dibatalkan', icon: XCircle },
    { value: 'reported', label: 'Dilaporkan', icon: AlertCircle },
  ];

  const getApplicationStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Menunggu',
      accepted: 'Diterima',
      rejected: 'Ditolak'
    };
    return statusMap[status] || status;
  };

  const getApplicationStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const canEditTask = (task: TaskData) => {
    return ['draft', 'open', 'pending'].includes(task.status);
  };

  const canCancelTask = (task: TaskData) => {
    return ['draft', 'open', 'pending', 'accepted'].includes(task.status);
  };

  const handleCancelTask = (taskId: string, taskTitle: string) => {
    setCancelModal({
      isOpen: true,
      taskId,
      taskTitle,
    });
  };

  const confirmCancelTask = async (reason: string) => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/tasks/${cancelModal.taskId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        fetchTasks();
        setCancelModal({ isOpen: false, taskId: '', taskTitle: '' });
        toast.success('Tugas berhasil dibatalkan');
      } else {
        toast.error('Gagal membatalkan tugas: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Terjadi kesalahan saat membatalkan tugas');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReportTask = (taskId: string, taskTitle: string, userType: 'worker' | 'employer') => {
    setReportModal({
      isOpen: true,
      taskId,
      taskTitle,
      userType,
    });
  };

  const confirmReportTask = async (reason: string, description: string, evidenceFiles: File[]) => {
    setIsReporting(true);
    try {
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('description', description);

      evidenceFiles.forEach((file) => {
        formData.append('evidence', file);
      });

      const response = await fetch(`/api/tasks/${reportModal.taskId}/report`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        fetchTasks();
        setReportModal({
          isOpen: false,
          taskId: '',
          taskTitle: '',
          userType: 'employer'
        });
        toast.success(data.message || 'Laporan berhasil dikirim dengan bukti pendukung');
      } else {
        toast.error(data.error || 'Gagal mengirim laporan');
      }
    } catch (error) {
      console.error('Error reporting task:', error);
      toast.error('Terjadi kesalahan saat mengirim laporan');
    } finally {
      setIsReporting(false);
    }
  };

  const handleChat = (phone?: string) => {
    if (!phone) {
      toast.error('Nomor WhatsApp tidak tersedia');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('62')) {
      formattedPhone = '62' + cleanPhone.replace(/^0/, '');
    }

    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      toast.error('Nomor telepon tidak tersedia');
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Riwayat Tugas</h1>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setMode('employer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'employer'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Sebagai Pemberi Kerja</span>
              </button>
              <button
                onClick={() => setMode('worker')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'worker'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Sebagai Pekerja</span>
              </button>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  Belum ada tugas {getTabStatusText(activeTab).toLowerCase()}
                  {mode === 'employer' ? ' yang Anda buat' : ' yang Anda kerjakan'}
                </p>
                {mode === 'employer' && activeTab !== 'reported' ? (
                  <Link href="/tugas/buat">
                    <Button className="mt-4">Buat Tugas Baru</Button>
                  </Link>
                ) : mode === 'worker' && activeTab !== 'reported' ? (
                  <Link href="/dashboard">
                    <Button className="mt-4">Cari Pekerjaan</Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const progress = calculateTaskProgress(
                  task.startDate,
                  task.startTime,
                  task.endDate,
                  task.endTime
                );

                const contactPerson = mode === 'employer' ? task.assignedTo : task.poster;

                return (
                  <div key={task._id}>
                    {activeTab === 'reported' ? (
                      <Card className="hover:shadow-lg transition-shadow border-2 border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-600">{task.category}</p>
                              {mode === 'employer' && task.assignedTo && (
                                <p className="text-sm text-blue-600 font-medium mt-1">
                                  Pekerja: {task.assignedTo.name || 'Tidak diketahui'}
                                </p>
                              )}
                              {mode === 'worker' && task.poster && (
                                <p className="text-sm text-green-600 font-medium mt-1">
                                  Pemberi Kerja: {task.poster.name || 'Tidak diketahui'}
                                </p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <span>📍</span>
                              <span>{task.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{formatDate(task.startDate)}</span>
                            </div>
                          </div>

                          {/* ✅ NEW: Display Report Status */}
                          {task.report ? (
                            <div className={`rounded-lg p-4 mb-4 border-l-4 ${task.report.status === 'resolved'
                                ? 'bg-green-50 border-l-green-500'
                                : 'bg-red-50 border-l-red-500'
                              }`}>
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  {task.report.status === 'resolved' ? (
                                    <>
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      <h4 className="font-semibold text-green-900">Laporan Diselesaikan</h4>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-5 h-5 text-red-600" />
                                      <h4 className="font-semibold text-red-900">Laporan Ditolak</h4>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {task.report.resolvedAt
                                    ? new Date(task.report.resolvedAt).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                    : 'Tanggal tidak tersedia'
                                  }
                                </p>
                              </div>

                              {/* Resolution Details */}
                              <div className="space-y-3">
                                {/* Who reported */}
                                <div>
                                  <p className="text-xs font-medium text-gray-600 mb-1">
                                    Status Laporan:
                                  </p>
                                  <p className={`text-sm font-semibold ${task.report.reporterType === 'worker'
                                      ? 'text-blue-700'
                                      : 'text-green-700'
                                    }`}>
                                    {task.report.reporterType === 'worker'
                                      ? 'Dilaporkan oleh Pekerja'
                                      : 'Dilaporkan oleh Pemberi Kerja'}
                                  </p>
                                </div>

                                {/* Admin Resolution */}
                                {task.report.status === 'resolved' && task.report.resolution && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1">
                                      Keputusan Admin:
                                    </p>
                                    <div className="bg-white rounded p-2 text-sm text-gray-700">
                                      {task.report.resolution}
                                    </div>
                                  </div>
                                )}

                                {/* Admin Notes */}
                                {task.report.adminNotes && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1">
                                      Catatan Admin:
                                    </p>
                                    <div className="bg-white rounded p-2 text-sm text-gray-700">
                                      {task.report.adminNotes}
                                    </div>
                                  </div>
                                )}

                                {/* Rejection reason */}
                                {task.report.status === 'rejected' && task.report.adminNotes && (
                                  <div>
                                    <p className="text-xs font-medium text-red-600 mb-1">
                                      Alasan Penolakan:
                                    </p>
                                    <div className="bg-white rounded p-2 text-sm text-gray-700">
                                      {task.report.adminNotes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg p-3 mb-4 border border-orange-300">
                              <div className="flex items-start gap-3">
                                <div className="text-2xl">⏳</div>
                                <div className="flex-1">
                                  <p className="font-semibold text-orange-900 text-sm">Sedang Dalam Investigasi</p>
                                  <p className="text-xs text-orange-800 mt-1">
                                    Laporan telah diterima dan sedang ditinjau oleh tim kami.
                                  </p>
                                  <p className="text-xs text-orange-700 mt-2 font-medium">
                                    Estimasi review: 1-3 hari kerja
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(task.budget)}
                            </span>
                            <div className="flex gap-2">
                              <Link href={`/tugas/${task._id}`}>
                                <Button variant="outline" size="sm">Detail</Button>
                              </Link>
                              {task.report?.status === 'resolved' || task.report?.status === 'rejected' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-500 cursor-not-allowed"
                                  disabled
                                >
                                  Selesai
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                  disabled
                                >
                                  Terkunci
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : activeTab === 'in_progress' ? (
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-600">{task.category}</p>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                              Proses
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <span>📍</span>
                              <span>{task.location}</span>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Mulai</div>
                                <div className="font-semibold text-gray-900">
                                  {task.startDate ? formatDate(task.startDate) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {task.startTime || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Selesai</div>
                                <div className="font-semibold text-gray-900">
                                  {task.endDate ? formatDate(task.endDate) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {task.endTime || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {contactPerson ? (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {contactPerson.name ? contactPerson.name.substring(0, 2).toUpperCase() : 'NA'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {contactPerson.name || 'Tidak diketahui'}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    {mode === 'employer' ? (
                                      <>
                                        <span className="text-yellow-500">⭐</span>
                                        <span>{contactPerson.rating || '4.8'} (120+ ulasan)</span>
                                      </>
                                    ) : (
                                      <span>✓ Terverifikasi</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${progress.status === 'finished'
                                        ? 'bg-blue-500'
                                        : progress.status === 'not_started'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                      }`}
                                    style={{ width: `${progress.percentage}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  <span className="font-semibold">{progress.percentage}%</span>
                                  {' • '}
                                  <span>{getProgressMessage(progress)}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={() => handleChat(contactPerson.phone)}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Chat WhatsApp
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={() => handleCall(contactPerson.phone)}
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Telepon
                                </Button>
                              </div>
                            </div>
                          ) : mode === 'employer' ? (
                            <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-center text-sm text-yellow-700">
                              Menunggu pekerja memulai tugas
                            </div>
                          ) : null}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(task.budget)}
                            </span>
                            <div className="flex gap-2">
                              <Link href={`/tugas/${task._id}`}>
                                <Button variant="outline" size="sm">Detail</Button>
                              </Link>
                              <button
                                onClick={() => handleReportTask(task._id, task.title, mode === 'employer' ? 'employer' : 'worker')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                              >
                                Laporkan
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-600">{task.category}</p>
                              {mode === 'employer' && task.assignedTo && (
                                <p className="text-sm text-blue-600 font-medium">
                                  Pekerja: {task.assignedTo.name || 'Tidak diketahui'}
                                </p>
                              )}
                              {mode === 'worker' && task.poster && (
                                <p className="text-sm text-green-600 font-medium">
                                  Pemberi Kerja: {task.poster.name || 'Tidak diketahui'}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${mode === 'worker' && task.applicationStatus
                                  ? getApplicationStatusColor(task.applicationStatus)
                                  : getStatusColor(task.status)
                                }`}
                            >
                              {mode === 'worker' && task.applicationStatus
                                ? getApplicationStatusLabel(task.applicationStatus)
                                : getStatusLabel(task.status)
                              }
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <span>📍</span>
                              <span>{task.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{formatDate(task.startDate)}</span>
                            </div>
                          </div>

                          {/* ✅ Special message for completed_worker status for worker */}
                          {mode === 'worker' && task.status === 'completed_worker' && (
                            <div className="bg-purple-50 rounded-lg p-3 mb-3 border-2 border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-900">Menunggu Konfirmasi Pemberi Kerja</h4>
                              </div>
                              <p className="text-sm text-purple-700">
                                Anda telah menyelesaikan tugas ini. Menunggu pemberi kerja untuk mengonfirmasi penyelesaian dan melepaskan pembayaran.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(task.budget)}
                            </span>
                            <div className="flex gap-2">
                              {mode === 'employer' && (
                                <>
                                  {canEditTask(task) && (
                                    <Link href={`/tugas/${task._id}/edit`}>
                                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                                        <Edit className="h-3 w-3" />
                                        Edit
                                      </Button>
                                    </Link>
                                  )}
                                  {canCancelTask(task) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelTask(task._id, task.title)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Batalkan
                                    </Button>
                                  )}
                                </>
                              )}
                              <Link href={`/tugas/${task._id}`}>
                                <Button variant="outline" size="sm">
                                  Detail →
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />

      <CancelTaskModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, taskId: '', taskTitle: '' })}
        onConfirm={confirmCancelTask}
        taskTitle={cancelModal.taskTitle}
        isLoading={isCancelling}
      />

      <ReportTaskModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, taskId: '', taskTitle: '', userType: 'employer' })}
        onConfirm={confirmReportTask}
        taskTitle={reportModal.taskTitle}
        isLoading={isReporting}
        userType={reportModal.userType}
      />
    </>
  );
}