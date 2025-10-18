'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Button } from '@/components/ui/button';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';
import Link from 'next/link';
import { Plus, ChevronRight, MapPin, Calendar, Star, Edit, Trash2, MessageCircle, Phone, AlertCircle, Building2, Briefcase, Users, TrendingUp, CheckCircle, Clock, DollarSign, Award, Search, FileText } from 'lucide-react';
import { CancelTaskModal } from '@/components/features/tasks/CancelTaskModal';
import { ReportTaskModal } from '@/components/features/tasks/ReportTaskModal';
import { toast } from 'sonner';
import { calculateTaskProgress, formatDuration, formatCurrency } from '@/lib/utils';

// ✅ Progress Status Message (using imported functions from utils)
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

const formatEarning = (amount: number) => {
  if (amount === 0) return 'Rp 0';
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccessFeatures, missingFields, isTaskerProfileComplete, canCreateTasks, missingBasicFields, verificationStatus, needsProfileCompletion } = useProfileValidation();
  const [activeTab, setActiveTab] = useState<'beri-kerja' | 'cari-kerja'>('beri-kerja');
  const [jobTab, setJobTab] = useState<'permintaan' | 'publikasi'>('permintaan');
  const [offeredJobs, setOfferedJobs] = useState<any[]>([]);
  const [activeWorkerJobs, setActiveWorkerJobs] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [taskStats, setTaskStats] = useState({
    active: 0,
    completed: 0,
    pending: 0,
    total: 0,
    earning: 2450000,
    rating: 4.8
  });
  const [workerStats, setWorkerStats] = useState({
    active: 0,
    completed: 0,
    pending: 0,
    total: 0,
    earning: 2450000,
    rating: 4.8
  });
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ NEW: State untuk Report Modal dengan userType
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
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  // ✅ Update current time every minute for real-time progress
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'cari-kerja' && canAccessFeatures) {
        fetchOfferedJobs();
        fetchActiveWorkerJobs();
        fetchWorkerStats();
        if (jobTab === 'publikasi') {
          fetchAllJobs();
        }
      } else if (activeTab === 'beri-kerja') {
        fetchMyTasks();
      }
    }
  }, [activeTab, jobTab, canAccessFeatures, status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && status === 'authenticated') {
        if (activeTab === 'beri-kerja') {
          fetchMyTasks();
        } else if (activeTab === 'cari-kerja' && canAccessFeatures) {
          fetchOfferedJobs();
          fetchActiveWorkerJobs();
          fetchWorkerStats();
          if (jobTab === 'publikasi') {
            fetchAllJobs();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab, canAccessFeatures, status]);

  const fetchOfferedJobs = async () => {
    try {
      console.log('=== Fetching ALL permintaan (open + pending for me) ===');
      console.log('Current user:', session?.user?.id);

      const availableResponse = await fetch('/api/jobs?searchMethod=find_worker&limit=50');
      const availableData = await availableResponse.json();

      let availableJobs: any[] = [];
      if (availableData.success) {
        availableJobs = availableData.data.filter((job: any) => {
          const jobOwnerId = job.postedBy?._id?.toString() || job.postedBy?.toString();
          const isNotMine = jobOwnerId !== session?.user?.id;
          const isOpen = ['open', 'draft'].includes(job.status);
          return isNotMine && isOpen;
        });
        console.log('Available jobs (open/draft):', availableJobs.length);
      }

      const workerResponse = await fetch('/api/worker-jobs');
      const workerData = await workerResponse.json();

      let pendingOffers: any[] = [];
      if (workerData.success) {
        pendingOffers = workerData.data.filter((job: any) =>
          job.status === 'pending' && job.isAssignedWorker === true
        );
        console.log('Pending offers for me:', pendingOffers.length);
      }

      const allPermintaanJobs = [...availableJobs, ...pendingOffers];
      console.log('Total permintaan jobs:', allPermintaanJobs.length);

      setOfferedJobs(allPermintaanJobs.slice(0, 3));

    } catch (error) {
      console.error('Error fetching offered jobs:', error);
      setOfferedJobs([]);
    }
  };

  const fetchActiveWorkerJobs = async () => {
    try {
      console.log('Fetching active worker jobs for user:', session?.user?.id);

      const response = await fetch('/api/worker-jobs');

      if (!response.ok) {
        console.error('Active worker jobs API error:', response.status, response.statusText);
        setActiveWorkerJobs([]);
        return;
      }

      const responseText = await response.text();

      if (!responseText) {
        console.error('Empty response from active worker jobs API');
        setActiveWorkerJobs([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error in active worker jobs:', jsonError);
        setActiveWorkerJobs([]);
        return;
      }

      if (data.success) {
        const activeJobs = data.data.filter((job: any) => {
          const isActiveStatus = ['accepted', 'active'].includes(job.status);
          console.log('Worker job filtering:', {
            jobId: job._id,
            status: job.status,
            isActive: isActiveStatus
          });
          return isActiveStatus;
        });

        console.log('Filtered active worker jobs:', activeJobs.length);
        setActiveWorkerJobs(activeJobs.slice(0, 2));
      } else {
        console.error('Active worker jobs API failed:', data.error);
        setActiveWorkerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching active worker jobs:', error);
      setActiveWorkerJobs([]);
    }
  };

  const fetchAllJobs = async () => {
    try {
      console.log('Fetching all publication jobs for user:', session?.user?.id);
      const response = await fetch('/api/jobs?limit=20&searchMethod=publication');
      const data = await response.json();

      if (data.success) {
        console.log('Raw publication jobs:', data.data);

        const filteredJobs = data.data.filter((job: any) => {
          const jobOwnerId = job.postedBy?._id || job.postedBy;
          const currentUserId = session?.user?.id;

          const shouldInclude = jobOwnerId !== currentUserId;

          console.log('Publication job filter:', {
            jobId: job._id,
            title: job.title,
            jobOwner: jobOwnerId,
            currentUser: currentUserId,
            shouldInclude
          });

          return shouldInclude;
        });

        console.log('Filtered publication jobs count:', filteredJobs.length);
        setAllJobs(filteredJobs);
      } else {
        console.error('Publication jobs API failed:', data.error);
        setAllJobs([]);
      }
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      setAllJobs([]);
    }
  };

  const fetchMyTasks = async () => {
    try {
      console.log('🔄 Fetching my tasks for employer...');
      const response = await fetch('/api/my-tasks?status=ongoing&limit=5');
      const data = await response.json();
      console.log('📋 My tasks response:', data);
      console.log('📊 Tasks detail:', data.data?.map((t: any) => ({ 
        id: t._id, 
        title: t.title, 
        status: t.status,
        assignedTo: t.assignedTo?.name 
      })));

      if (data.success) {
        setMyTasks(data.data);

        const statsResponse = await fetch('/api/my-tasks');
        const statsData = await statsResponse.json();
        console.log('Employer Stats response:', statsData);

        if (statsData.success) {
          const tasks = statsData.data;
          setTaskStats({
            active: tasks.filter((t: any) =>
              ['accepted', 'active', 'proses'].includes(t.status) && t.assignedTo
            ).length,
            completed: tasks.filter((t: any) =>
              ['completed', 'selesai'].includes(t.status)
            ).length,
            pending: tasks.filter((t: any) => {
              if (t.status === 'open' && !t.assignedTo) return true;
              if (['open', 'pending'].includes(t.status) && t.assignedTo) return true;
              if (t.status === 'completed_worker' && t.assignedTo) return true;
              return false;
            }).length,
            total: tasks.length,
            earning: 2450000,
            rating: 4.8
          });
        }
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      console.log('Fetching worker stats...');
      const response = await fetch('/api/worker-jobs');
      const data = await response.json();
      console.log('Worker stats response:', data);

      if (data.success) {
        const workerJobs = data.data;

        // ✅ NEW: Calculate real earning from completed tasks
        const completedJobs = workerJobs.filter((job: any) =>
          ['completed', 'selesai'].includes(job.status)
        );

        const totalEarning = completedJobs.reduce((total: number, job: any) => {
          return total + (job.budget || 0);
        }, 0);

        console.log('💰 Calculated earnings:', {
          completedJobs: completedJobs.length,
          totalEarning: totalEarning,
          jobs: completedJobs.map((j: any) => ({
            title: j.title,
            budget: j.budget,
            status: j.status
          }))
        });

        setWorkerStats({
          active: workerJobs.filter((job: any) =>
            ['accepted', 'active', 'proses'].includes(job.status)
          ).length,
          completed: completedJobs.length,
          pending: workerJobs.filter((job: any) =>
            job.status === 'pending' || job.status === 'completed_worker'
          ).length,
          total: workerJobs.length,
          earning: totalEarning, // ✅ Use calculated earning
          rating: 4.8 // Keep static for now, or calculate from reviews
        });
      } else {
        setWorkerStats({
          active: 0,
          completed: 0,
          pending: 0,
          total: 0,
          earning: 0,
          rating: 0
        });
      }
    } catch (error) {
      console.error('Error fetching worker stats:', error);
      setWorkerStats({
        active: 0,
        completed: 0,
        pending: 0,
        total: 0,
        earning: 0,
        rating: 0
      });
    }
  };

  const getCategoryLabel = (cat: string) => {
    const categoryMap: { [key: string]: string } = {
      kebersihan: 'Kebersihan',
      teknisi: 'Teknisi',
      renovasi: 'Renovasi',
      tukang: 'Tukang',
      angkut: 'Angkut Barang',
      taman: 'Taman & Kebun',
      lainnya: 'Lainnya'
    };
    return categoryMap[cat] || cat;
  };

  const canEditTask = (task: any) => {
    return ['draft', 'open', 'pending'].includes(task.status);
  };

  const canCancelTask = (task: any) => {
    return ['draft', 'open', 'pending'].includes(task.status);
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
        fetchMyTasks();
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

  const handleAcceptOfferedJob = async (jobId: string) => {
    // Redirect to agreement page instead of direct acceptance
    router.push(`/pekerjaan/${jobId}/perjanjian?action=accept&from=dashboard`);
  };

  const handleRejectOfferedJob = async (jobId: string) => {
    try {
      setProcessingJobId(jobId);

      const response = await fetch(`/api/tasks/${jobId}/reject-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchOfferedJobs();
        toast.success('Pekerjaan berhasil ditolak');
      } else {
        toast.error(data.error || 'Gagal menolak pekerjaan');
      }
    } catch (error) {
      console.error('Error rejecting offered job:', error);
      toast.error('Terjadi kesalahan saat menolak pekerjaan');
    } finally {
      setProcessingJobId(null);
    }
  };

  // ✅ NEW: Handle Complete Task
  const handleCompleteTask = async (taskId: string, userType: 'worker' | 'employer') => {
    setIsCompleting(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data
        if (activeTab === 'beri-kerja') {
          fetchMyTasks();
        } else {
          fetchActiveWorkerJobs();
          fetchWorkerStats();
        }
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Gagal menyelesaikan tugas');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Terjadi kesalahan saat menyelesaikan tugas');
    } finally {
      setIsCompleting(null);
    }
  };

  // ✅ NEW: Handle Report Task - dengan userType parameter
  const handleReportTask = (taskId: string, taskTitle: string, userType: 'worker' | 'employer') => {
    setReportModal({
      isOpen: true,
      taskId,
      taskTitle,
      userType, // ✅ Set userType saat membuka modal
    });
  };

  const confirmReportTask = async (reason: string, description: string, evidenceFiles: File[]) => {
    setIsReporting(true);
    try {
      // ✅ Create FormData untuk support file upload
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('description', description);

      // ✅ Append semua file evidence
      evidenceFiles.forEach((file) => {
        formData.append('evidence', file);
      });

      const response = await fetch(`/api/tasks/${reportModal.taskId}/report`, {
        method: 'POST',
        body: formData, // ✅ Kirim FormData, bukan JSON
        // ❌ JANGAN set Content-Type header, browser akan set otomatis dengan boundary
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data
        if (activeTab === 'beri-kerja') {
          fetchMyTasks();
        } else {
          fetchActiveWorkerJobs();
          fetchWorkerStats();
        }
        setReportModal({ isOpen: false, taskId: '', taskTitle: '', userType: 'employer' });
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

  // ✅ Handle WhatsApp Chat
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

  // ✅ Handle Phone Call
  const handleCall = (phone?: string) => {
    if (!phone) {
      toast.error('Nomor telepon tidak tersedia');
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 pb-20">
        <div className="container mx-auto max-w-6xl px-4 py-6 animate-fade-in">
          {/* User Welcome */}
          <div className="mb-6 animate-slide-down">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Halo, {session.user.name}! 👋
              </h1>
              <p className="text-gray-600">Selamat datang kembali di Naro</p>
            </div>
          </div>

          {/* Verification Alert */}
          {verificationStatus === 'not_submitted' && !session.user.isVerified && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4 mb-6 border-l-4 border-orange-500">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="text-xl sm:text-2xl">⚠️</div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-semibold text-orange-800">Verifikasi Diperlukan</div>
                  <div className="text-xs sm:text-sm text-orange-700">Lengkapi verifikasi KTP untuk menggunakan semua fitur</div>
                </div>
                <Link href="/verifikasi" className="w-full sm:w-auto">
                  <Button size="sm" className="text-xs w-full sm:w-auto">Verifikasi</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Pending Verification Alert */}
          {verificationStatus === 'pending' && !session.user.isVerified && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 mb-6 border-l-4 border-purple-500">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">⏳</div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-semibold text-purple-800 mb-1">Verifikasi Sedang Diproses</div>
                  <div className="text-xs sm:text-sm text-purple-700 mb-2">Admin sedang meninjau verifikasi KTP Anda. Mohon tunggu beberapa saat.</div>
                </div>
                <div className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold self-start sm:self-center whitespace-nowrap">
                  Menunggu
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion Alert */}
          {needsProfileCompletion && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 mb-6 border-l-4 border-blue-500">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="text-xl sm:text-2xl">📝</div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-semibold text-blue-800">Lengkapi Profil Anda</div>
                  <div className="text-xs sm:text-sm text-blue-700">Anda sudah terverifikasi! Silakan lengkapi profil untuk akses penuh.</div>
                </div>
                <Link href="/profil" className="w-full sm:w-auto">
                  <Button size="sm" className="text-xs w-full sm:w-auto">Lengkapi</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div className="mb-6 animate-slide-up">
            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/30">
              <div className="flex gap-2">
                <button
                  onClick={() => !session.user.isVerified ? null : setActiveTab('beri-kerja')}
                  disabled={!session.user.isVerified}
                  className={`flex-1 py-4 px-5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${activeTab === 'beri-kerja'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    } ${!session.user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Building2 className="w-5 h-5" />
                  Mode Pemberi Kerja
                </button>
                <button
                  onClick={() => !session.user.isVerified ? null : setActiveTab('cari-kerja')}
                  disabled={!session.user.isVerified}
                  className={`flex-1 py-4 px-5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 ${activeTab === 'cari-kerja'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    } ${!session.user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Briefcase className="w-5 h-5" />
                  Mode Cari Kerja
                </button>
              </div>
            </div>
          </div>

          {/* Show lock message if not verified */}
          {!session.user.isVerified && (
            <div className="bg-white rounded-xl p-8 text-center mb-6 border-2 border-gray-200">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fitur Terkunci</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Untuk menggunakan semua fitur Naro, silakan verifikasi akun Anda terlebih dahulu dengan mengunggah KTP.
              </p>
              <div className="space-y-3 mb-6">
                <Link href="/pekerja" className="block">
                  <Button className="w-full sm:w-auto" size="lg">
                    🔍 Cari Tasker
                  </Button>
                </Link>
                {verificationStatus === 'not_submitted' && (
                  <Link href="/verifikasi" className="block">
                    <Button variant="outline" className="w-full sm:w-auto" size="lg">
                      📋 Verifikasi Sekarang
                    </Button>
                  </Link>
                )}
              </div>
              <div className="text-sm text-gray-500">
                <p className="mb-1">✅ Cari & lihat profil pekerja</p>
                <p className="opacity-50">❌ Buat tugas & terima pekerjaan</p>
              </div>
            </div>
          )}

          {/* Content based on active tab - Only show if verified */}
          {session.user.isVerified && activeTab === 'beri-kerja' ? (
            <>
              {/* Employer Mode Content */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 mb-6 text-white shadow-xl relative overflow-hidden animate-card-pop">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full"></div>
                
                <div className="relative flex justify-between items-center">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                      <TrendingUp className="w-7 h-7" />
                      Butuh Bantuan Pekerjaan?
                    </h2>
                    <p className="text-sm opacity-90 mb-6 leading-relaxed">
                      Posting tugas dan temukan pekerja profesional terbaik untuk kebutuhan Anda
                    </p>
                    <Link href="/tugas/buat">
                      <button className="bg-white text-blue-600 px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md">
                        <Plus className="w-5 h-5" />
                        Buat Tugas Baru
                      </button>
                    </Link>
                  </div>
                  <div className="text-7xl opacity-80 animate-bounce-gentle">
                    <Users className="w-20 h-20 text-white/70" />
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{taskStats.active}</div>
                  <div className="text-xs text-gray-500 font-medium">Aktif</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{taskStats.completed}</div>
                  <div className="text-xs text-gray-500 font-medium">Selesai</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{taskStats.pending}</div>
                  <div className="text-xs text-gray-500 font-medium">Pending</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{taskStats.rating}</div>
                  <div className="text-xs text-gray-500 font-medium">Rating</div>
                </div>
              </div>

              {/* My Active Tasks with Real-time Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Tugas Berlangsung</h2>
                  <Link href="/riwayat?mode=employer" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                    Riwayat <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {myTasks.length > 0 ? (
                  <div className="space-y-4">
                    {myTasks.slice(0, 2).map((task) => {
                      // ✅ Calculate real-time progress
                      const progress = calculateTaskProgress(
                        task.startDate,
                        task.startTime,
                        task.endDate,
                        task.endTime
                      );

                      return (
                        <div key={task._id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-card-pop-stagger">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-600">{getCategoryLabel(task.category)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'completed_worker' ? 'bg-purple-100 text-purple-700' :
                              ['active', 'accepted', 'proses'].includes(task.status) ? 'bg-green-100 text-green-700' :
                                task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-gray-100 text-gray-700'
                              }`}>
                              {task.status === 'completed_worker' ? 'Menunggu Konfirmasi' :
                                ['active', 'accepted', 'proses'].includes(task.status) ? 'Proses' :
                                  task.status === 'pending' ? 'Pending' :
                                    task.status === 'completed' ? 'Selesai' :
                                      task.status === 'open' ? 'Open' : 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{task.location || 'Lokasi tidak tersedia'}</span>
                            </div>
                          </div>

                          {/* ✅ Complete Schedule Info */}
                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Mulai</div>
                                <div className="font-semibold text-gray-900">
                                  {task.startDate ? new Date(task.startDate).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {task.startTime || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Selesai</div>
                                <div className="font-semibold text-gray-900">
                                  {task.endDate ? new Date(task.endDate).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {task.endTime || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ✅ Worker Info with Real-time Progress */}
                          {['accepted', 'active', 'proses'].includes(task.status) && task.assignedTo ? (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {task.assignedTo?.name ? task.assignedTo.name.substring(0, 2).toUpperCase() : 'NA'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {task.assignedTo?.name || 'Pekerja'}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <span className="text-yellow-500">⭐</span>
                                    <span>{task.assignedTo?.rating || '4.8'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
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

                              {/* Contact Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleChat(task.assignedTo?.phone)}
                                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Chat WhatsApp
                                </button>
                                <button
                                  onClick={() => handleCall(task.assignedTo?.phone)}
                                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                  <Phone className="w-3 h-3" />
                                  Telepon
                                </button>
                              </div>
                            </div>
                          ) : task.status === 'completed_worker' && task.assignedTo ? (
                            <div className="bg-purple-50 rounded-lg p-3 mb-4 border-2 border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-5 h-5 text-purple-600" />
                                <h4 className="font-semibold text-purple-900">Menunggu Konfirmasi Anda</h4>
                              </div>
                              <p className="text-sm text-purple-700">
                                Pekerja telah menyelesaikan tugas. Silakan periksa hasil pekerjaan dan berikan konfirmasi penyelesaian.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-center text-sm text-yellow-700">
                              Menunggu pekerja menerima tugas
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(task.budget)}
                            </span>
                            <div className="flex gap-2">
                              {canEditTask(task) && (
                                <Link href={`/tugas/${task._id}/edit`}>
                                  <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1">
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </button>
                                </Link>
                              )}
                              {canCancelTask(task) && (
                                <button
                                  onClick={() => handleCancelTask(task._id, task.title)}
                                  className="bg-gray-100 text-red-600 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Batalkan
                                </button>
                              )}
                              {/* ✅ NEW: Button Laporkan - dengan userType 'employer' */}
                              {['accepted', 'active', 'proses'].includes(task.status) && task.assignedTo && (
                                <button
                                  onClick={() => handleReportTask(task._id, task.title, 'employer')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                                >
                                  Laporkan
                                </button>
                              )}
                              {/* ✅ NEW: Button Selesai */}
                              {['accepted', 'active', 'proses', 'completed_worker'].includes(task.status) && task.assignedTo && (
                                <button
                                  onClick={() => handleCompleteTask(task._id, 'employer')}
                                  disabled={isCompleting === task._id}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                  {isCompleting === task._id ? 'Proses...' :
                                    task.status === 'completed_worker' ? 'Konfirmasi' : 'Selesai'}
                                </button>
                              )}
                              <Link href={`/tugas/${task._id}`}>
                                <button className="bg-primary-100 text-primary-600 px-4 py-2 rounded-lg text-xs font-semibold">
                                  Detail →
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 text-center text-gray-500 shadow-lg border border-white/30 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-sm font-medium mb-2">Belum ada tugas aktif</div>
                    <div className="text-xs text-gray-400">Tugas yang sedang berlangsung akan muncul di sini</div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/pekerja" className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-white/30 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Search className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Cari Tasker</div>
                  <div className="text-xs text-gray-500">Temukan pekerja</div>
                </Link>
                <Link href={`/riwayat?mode=employer`} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-white/30 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Riwayat</div>
                  <div className="text-xs text-gray-500">Lihat semua tugas</div>
                </Link>
              </div>
            </>
          ) : session.user.isVerified && activeTab === 'cari-kerja' ? (
            <>
              {/* Worker Mode Content */}
              {/* Only show full worker mode if verified and profile complete */}
              {!canAccessFeatures ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="text-4xl mb-4">👷</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mode Cari Kerja</h3>
                  <p className="text-gray-600 mb-6">
                    Lengkapi profil Anda untuk menggunakan mode ini.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Sementara itu, Anda dapat melihat profil para pekerja:
                  </p>
                  <Link href="/pekerja">
                    <Button className="mb-2">
                      🔍 Lihat Pekerja
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-400 mt-2">
                    Fitur lengkap akan tersedia setelah profil dilengkapi
                  </p>
                </div>
              ) : (
                <>
              <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden animate-card-pop">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full"></div>
                
                <div className="relative flex gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/90 mb-1">Total Penghasilan</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatCurrency(workerStats.earning)}
                    </div>
                    <div className="text-xs text-white/80">
                      dari {workerStats.completed} pekerjaan selesai
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-white/30 animate-slide-up">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 mb-1">Status Ketersediaan</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        {isAvailable ? 'Saat ini Anda sedang tersedia' : 'Saat ini Anda tidak tersedia'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAvailable(!isAvailable)}
                    disabled={!canAccessFeatures}
                    className={`w-16 h-9 rounded-full relative transition-all duration-300 shadow-inner ${isAvailable ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
                      } ${!canAccessFeatures ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                  >
                    <div className={`absolute w-7 h-7 bg-white rounded-full top-1 transition-all duration-300 shadow-md flex items-center justify-center ${isAvailable ? 'right-1' : 'left-1'
                      }`}>
                      {isAvailable ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{workerStats.active}</div>
                  <div className="text-xs text-gray-500 font-medium">Aktif</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{workerStats.completed}</div>
                  <div className="text-xs text-gray-500 font-medium">Selesai</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatEarning(workerStats.earning)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Earning</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-card-pop-delay-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{workerStats.rating}</div>
                  <div className="text-xs text-gray-500 font-medium">Rating</div>
                </div>
              </div>

              {/* Active Worker Jobs with Real-time Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Pekerjaan Berlangsung</h2>
                  <Link href="/riwayat?mode=worker" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                    Riwayat <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {activeWorkerJobs.length > 0 ? (
                  <div className="space-y-4">
                    {activeWorkerJobs.map((job) => {
                      // ✅ Calculate real-time progress
                      const progress = calculateTaskProgress(
                        job.startDate,
                        job.startTime,
                        job.endDate,
                        job.endTime
                      );

                      return (
                        <div key={job._id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-card-pop-stagger">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span>{job.poster?.name || 'Anonymous'}</span>
                                {job.poster?.isVerified && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'completed_worker' ? 'bg-purple-100 text-purple-700' :
                              ['active', 'accepted', 'proses'].includes(job.status) ? 'bg-green-100 text-green-700' :
                                job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                              {job.status === 'completed_worker' ? 'Menunggu Konfirmasi' :
                                ['active', 'accepted', 'proses'].includes(job.status) ? 'Proses' :
                                  job.status === 'completed' ? 'Selesai' : 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location || 'Lokasi tidak tersedia'}</span>
                            </div>
                          </div>

                          {/* ✅ Complete Schedule Info */}
                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Mulai</div>
                                <div className="font-semibold text-gray-900">
                                  {job.startDate ? new Date(job.startDate).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {job.startTime || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Tanggal Selesai</div>
                                <div className="font-semibold text-gray-900">
                                  {job.endDate ? new Date(job.endDate).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'Belum ditentukan'}
                                </div>
                                <div className="text-primary-600 font-medium mt-1">
                                  {job.endTime || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ✅ Poster Info with Real-time Progress */}
                          {['accepted', 'active'].includes(job.status) && job.poster ? (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {job.poster?.name ? job.poster.name.substring(0, 2).toUpperCase() : 'NA'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {job.poster?.name || 'Pemberi Kerja'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    ✓ Terverifikasi
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
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

                              {/* Contact Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleChat(job.poster?.phone)}
                                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  Chat WhatsApp
                                </button>
                                <button
                                  onClick={() => handleCall(job.poster?.phone)}
                                  className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-50"
                                >
                                  <Phone className="w-3 h-3" />
                                  Telepon
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(job.budget)}
                            </span>
                            <div className="flex gap-2">
                              {/* ✅ NEW: Button Laporkan - dengan userType 'worker' */}
                              {['accepted', 'active', 'proses'].includes(job.status) && (
                                <button
                                  onClick={() => handleReportTask(job._id, job.title, 'worker')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                                >
                                  Laporkan
                                </button>
                              )}
                              {/* ✅ NEW: Button Selesai */}
                              {['accepted', 'active', 'proses'].includes(job.status) && (
                                <button
                                  onClick={() => handleCompleteTask(job._id, 'worker')}
                                  disabled={isCompleting === job._id}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                  {isCompleting === job._id ? 'Proses...' : 'Selesai'}
                                </button>
                              )}
                              <Link href={`/tugas/${job._id}`}>
                                <button className="bg-primary-100 text-primary-600 px-4 py-2 rounded-lg text-xs font-semibold">
                                  Detail →
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 text-center text-gray-500 shadow-lg border border-white/30 animate-fade-in">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-10 h-10 text-blue-400" />
                    </div>
                    <div className="text-sm font-medium mb-2">Belum ada pekerjaan aktif</div>
                    <div className="text-xs text-gray-400">Terima pekerjaan untuk melihat progress di sini</div>
                  </div>
                )}
              </div>

              {/* Tab Section */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => setJobTab('permintaan')}
                    className={`py-4 px-5 border-2 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 ${jobTab === 'permintaan'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 shadow-lg shadow-blue-200'
                      : 'border-gray-200 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <Search className="w-5 h-5" />
                    Permintaan
                  </button>
                  <button
                    onClick={() => setJobTab('publikasi')}
                    className={`py-4 px-5 border-2 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 ${jobTab === 'publikasi'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 shadow-lg shadow-blue-200'
                      : 'border-gray-200 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <FileText className="w-5 h-5" />
                    Publikasi
                  </button>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {jobTab === 'permintaan' ? 'Permintaan' : 'Publikasi'}
                  </h2>
                  {jobTab === 'publikasi' && (
                    <Link href="/pekerjaan" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                      Lihat Semua <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Available Jobs based on Tab */}
                {jobTab === 'permintaan' ? (
                  offeredJobs.length > 0 ? (
                    <div className="space-y-4">
                      {offeredJobs.map((job, index) => (
                        <div key={job._id} className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-card-pop-delay-${index + 1}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span>{job.postedBy?.name || 'Anonymous'}</span>
                                {job.postedBy?.isVerified && (
                                  <span className="text-primary-500">✓</span>
                                )}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                              Ditawari
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location || 'Lokasi tidak tersedia'}</span>
                            </div>
                          </div>

                          {/* Schedule Info */}
                          {job.startDate && job.endDate ? (
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="text-gray-500 mb-1">Tanggal Mulai</div>
                                  <div className="font-semibold text-gray-900">
                                    {new Date(job.startDate).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-primary-600 font-medium mt-1">
                                    {job.startTime || '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Tanggal Selesai</div>
                                  <div className="font-semibold text-gray-900">
                                    {new Date(job.endDate).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-primary-600 font-medium mt-1">
                                    {job.endTime || '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center text-sm text-gray-600">
                              Jadwal akan ditentukan bersama
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(job.budget)}
                            </span>
                            <div className="flex gap-2">
                              <Link href={`/pekerjaan/${job._id}`}>
                                <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-xs font-semibold">
                                  Detail
                                </button>
                              </Link>
                              <button
                                onClick={() => handleRejectOfferedJob(job._id)}
                                disabled={processingJobId === job._id}
                                className="bg-white text-red-600 border border-red-600 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-red-50"
                              >
                                {processingJobId === job._id ? 'Menolak...' : 'Tolak'}
                              </button>
                              <button
                                onClick={() => handleAcceptOfferedJob(job._id)}
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-shadow"
                              >
                                Terima
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                      <div className="text-4xl mb-3">🎯</div>
                      <div className="text-sm font-medium">Belum ada pekerjaan yang ditawari</div>
                      <p className="text-xs text-gray-400 mt-1">Pekerjaan yang ditawarkan langsung akan muncul di sini</p>
                    </div>
                  )
                ) : (
                  allJobs.length > 0 ? (
                    <div className="space-y-4">
                      {allJobs.map((job, index) => (
                        <div key={job._id} className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-card-pop-delay-${index + 1}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span>{job.postedBy?.name || 'Anonymous'}</span>
                                {job.postedBy?.isVerified && (
                                  <span className="text-primary-500">✓</span>
                                )}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              📝 Publikasi
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location || 'Lokasi tidak tersedia'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(job.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}</span>
                            </div>
                          </div>

                          {/* Schedule Info */}
                          {job.startDate && job.endDate ? (
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="text-gray-500 mb-1">Tanggal Mulai</div>
                                  <div className="font-semibold text-gray-900">
                                    {new Date(job.startDate).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-primary-600 font-medium mt-1">
                                    {job.startTime || '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">Tanggal Selesai</div>
                                  <div className="font-semibold text-gray-900">
                                    {new Date(job.endDate).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-primary-600 font-medium mt-1">
                                    {job.endTime || '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center text-sm text-gray-600">
                              Jadwal akan ditentukan bersama
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-primary-600">
                              {formatCurrency(job.budget)}
                            </span>
                            <Link href={`/pekerjaan/${job._id}`}>
                              <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                                Lihat Detail
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                      <div className="text-4xl mb-3">📝</div>
                      <div className="text-sm font-medium">Belum ada pekerjaan publikasi tersedia</div>
                      <p className="text-xs text-gray-400 mt-1">Pekerjaan baru akan muncul di sini</p>
                    </div>
                  )
                )}
              </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </main>
      <BottomNav />

      {/* ✅ Modals */}
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