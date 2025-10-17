'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Button } from '@/components/ui/button';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';
import Link from 'next/link';
import { Plus, ChevronRight, MapPin, Calendar, Star, Edit, Trash2, AlertCircle } from 'lucide-react';
import { CancelTaskModal } from '@/components/features/tasks/CancelTaskModal';
import { toast } from 'sonner';

type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccessFeatures, missingFields, isTaskerProfileComplete, canCreateTasks, missingBasicFields } = useProfileValidation();
  const [activeTab, setActiveTab] = useState<'beri-kerja' | 'cari-kerja'>('beri-kerja');
  const [jobTab, setJobTab] = useState<'permintaan' | 'publikasi'>('permintaan');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_submitted');
  const [isLoadingVerification, setIsLoadingVerification] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch verification status when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchVerificationStatus();
    }
  }, [status, session?.user]);

  const fetchVerificationStatus = async () => {
    try {
      setIsLoadingVerification(true);
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      
      if (data.success && data.data?.ktpVerification?.status) {
        setVerificationStatus(data.data.ktpVerification.status);
      } else {
        setVerificationStatus('not_submitted');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setVerificationStatus('not_submitted');
    } finally {
      setIsLoadingVerification(false);
    }
  };

  // Refresh data when component mounts or tab changes
  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'cari-kerja') {
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
  }, [activeTab, jobTab, status]);

  // Additional refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && status === 'authenticated') {
        if (activeTab === 'beri-kerja') {
          fetchMyTasks();
        } else if (activeTab === 'cari-kerja') {
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
  }, [activeTab, status]);

  const fetchOfferedJobs = async () => {
    try {
      const response = await fetch('/api/jobs?searchMethod=find_worker&limit=10');
      
      if (!response.ok) {
        console.error('Offered jobs API error:', response.status, response.statusText);
        setOfferedJobs([]);
        return;
      }
      
      const responseText = await response.text();
      if (!responseText) {
        console.error('Empty response from offered jobs API');
        setOfferedJobs([]);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error in offered jobs:', jsonError);
        setOfferedJobs([]);
        return;
      }
      
      if (data.success) {
        const permintaanJobs = data.data.filter((job: any) => {
          const jobOwnerId = job.postedBy?._id || job.postedBy;
          const currentUserId = session?.user?.id;
          const isOwn = jobOwnerId === currentUserId;
          const isPendingForUser = job.status === 'pending' && job.assignedTo === currentUserId;
          
          return (!isOwn && job.status === 'open') || isPendingForUser;
        });
        
        setOfferedJobs(permintaanJobs.slice(0, 3));
      } else {
        setOfferedJobs([]);
      }
    } catch (error) {
      console.error('Error fetching offered jobs:', error);
      setOfferedJobs([]);
    }
  };

  const fetchActiveWorkerJobs = async () => {
    try {
      const response = await fetch('/api/worker-jobs');
      
      if (!response.ok) {
        setActiveWorkerJobs([]);
        return;
      }
      
      const responseText = await response.text();
      if (!responseText) {
        setActiveWorkerJobs([]);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        setActiveWorkerJobs([]);
        return;
      }
      
      if (data.success) {
        const activeJobs = data.data.filter((job: any) => {
          return ['pending', 'accepted', 'active'].includes(job.status);
        });
        
        setActiveWorkerJobs(activeJobs.slice(0, 2));
      } else {
        setActiveWorkerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching active worker jobs:', error);
      setActiveWorkerJobs([]);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const response = await fetch('/api/jobs?limit=20&searchMethod=publication');
      const data = await response.json();
      
      if (data.success) {
        const filteredJobs = data.data.filter((job: any) => {
          const jobOwnerId = job.postedBy?._id || job.postedBy;
          const currentUserId = session?.user?.id;
          return jobOwnerId !== currentUserId;
        });
        
        setAllJobs(filteredJobs);
      }
    } catch (error) {
      console.error('Error fetching all jobs:', error);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const response = await fetch('/api/my-tasks?status=ongoing&limit=5');
      const data = await response.json();
      
      if (data.success) {
        setMyTasks(data.data);
        
        const statsResponse = await fetch('/api/my-tasks');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          const tasks = statsData.data;
          setTaskStats({
            active: tasks.filter((t: any) => ['pending', 'accepted', 'active', 'proses'].includes(t.status) && t.assignedTo).length,
            completed: tasks.filter((t: any) => ['completed', 'selesai'].includes(t.status)).length,
            pending: tasks.filter((t: any) => 
              (t.status === 'open' && (t.applicants > 0 || !t.assignedTo)) || 
              (t.status === 'pending' && t.assignedTo)
            ).length,
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
      const response = await fetch('/api/worker-jobs');
      const data = await response.json();
      
      if (data.success) {
        const workerJobs = data.data;
        setWorkerStats({
          active: workerJobs.filter((job: any) => ['pending', 'accepted', 'active'].includes(job.status)).length,
          completed: workerJobs.filter((job: any) => job.status === 'completed').length,
          pending: workerJobs.filter((job: any) => job.status === 'pending').length,
          total: workerJobs.length,
          earning: 2450000,
          rating: 4.8
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

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
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
    return ['draft', 'open', 'pending'].includes(task.status) && !task.assignedTo;
  };

  const canCancelTask = (task: any) => {
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
    try {
      setProcessingJobId(jobId);
      
      const response = await fetch(`/api/tasks/${jobId}/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchOfferedJobs();
        fetchActiveWorkerJobs();
        fetchWorkerStats();
        alert('Pekerjaan berhasil diterima! Cek di bagian pekerjaan aktif.');
      } else {
        alert(data.error || 'Gagal menerima pekerjaan');
      }
    } catch (error) {
      console.error('Error accepting offered job:', error);
      alert('Terjadi kesalahan saat menerima pekerjaan');
    } finally {
      setProcessingJobId(null);
    }
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
        alert('Pekerjaan berhasil ditolak');
      } else {
        alert(data.error || 'Gagal menolak pekerjaan');
      }
    } catch (error) {
      console.error('Error rejecting offered job:', error);
      alert('Terjadi kesalahan saat menolak pekerjaan');
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleCreateTaskClick = () => {
    if (!canCreateTasks) {
      if (verificationStatus !== 'approved') {
        if (verificationStatus === 'pending') {
          toast.error('Verifikasi Anda sedang diproses. Harap tunggu');
        } else if (verificationStatus === 'rejected') {
          toast.error('Verifikasi Anda ditolak. Silakan submit ulang');
          router.push('/verifikasi');
        } else {
          toast.error('Lengkapi verifikasi KTP terlebih dahulu untuk membuat tugas');
          router.push('/verifikasi');
        }
      } else if (missingBasicFields.length > 0) {
        toast.error(`Lengkapi profil terlebih dahulu: ${missingBasicFields.join(', ')}`);
        router.push('/profil');
      }
      return;
    }
    router.push('/tugas/buat');
  };

  if (status === 'loading' || isLoadingVerification) {
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
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          {/* User Welcome */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Halo, {session.user.name}! 
            </h1>
            <p className="text-gray-600">Selamat datang kembali di Naro</p>
          </div>

          {/* Verification Status Alert - NOT SUBMITTED */}
          {verificationStatus === 'not_submitted' && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-6 border-l-4 border-orange-500">
              <div className="flex gap-3">
                <div className="text-xl">⚠️</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-orange-800">Verifikasi Diperlukan</div>
                  <div className="text-xs text-orange-700">Lengkapi verifikasi untuk membuat tugas dan melamar pekerjaan</div>
                </div>
                <Link href="/verifikasi">
                  <Button size="sm" className="text-xs">Verifikasi</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Verification Status Alert - PENDING */}
          {verificationStatus === 'pending' && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border-l-4 border-blue-500">
              <div className="flex gap-3">
                <div className="text-xl">⏳</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800">Menunggu Verifikasi</div>
                  <div className="text-xs text-blue-700">Verifikasi Anda sedang diproses. Kami akan memberitahu Anda ketika sudah selesai</div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status Alert - REJECTED */}
          {verificationStatus === 'rejected' && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 mb-6 border-l-4 border-red-500">
              <div className="flex gap-3">
                <div className="text-xl">❌</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800">Verifikasi Ditolak</div>
                  <div className="text-xs text-red-700">Verifikasi Anda ditolak. Silakan submit ulang dengan foto yang lebih jelas</div>
                </div>
                <Link href="/verifikasi">
                  <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700">Coba Lagi</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Profile Incomplete Alert - Only show if verified but profile incomplete */}
          {verificationStatus === 'approved' && missingBasicFields.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border-l-4 border-blue-500">
              <div className="flex gap-3">
                <div className="text-xl">ℹ️</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-800">Lengkapi Profil</div>
                  <div className="text-xs text-blue-700">
                    Lengkapi: {missingBasicFields.join(', ')} untuk membuat tugas
                  </div>
                </div>
                <Link href="/profil">
                  <Button size="sm" variant="outline" className="text-xs border-blue-600 text-blue-600">
                    Lengkapi
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div className="mb-6">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('beri-kerja')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'beri-kerja'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  🏢 Mode Pemberi Kerja
                </button>
                <button
                  onClick={() => setActiveTab('cari-kerja')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'cari-kerja'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  💼 Mode Cari Kerja
                </button>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'beri-kerja' ? (
            <>
              {/* Hero Card */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-2">Butuh Bantuan Pekerjaan?</h2>
                    <p className="text-sm opacity-90 mb-4">
                      Post tugas dan temukan pekerja terbaik
                    </p>
                    <button 
                      onClick={handleCreateTaskClick}
                      disabled={!canCreateTasks || verificationStatus === 'pending'}
                      className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                        canCreateTasks && verificationStatus !== 'pending'
                          ? 'bg-white text-primary-600 hover:shadow-lg active:scale-95' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Buat Tugas Baru
                    </button>
                    {!canCreateTasks && (
                      <p className="text-xs mt-2 opacity-90">
                        {verificationStatus === 'pending'
                          ? '⏳ Menunggu verifikasi'
                          : verificationStatus === 'rejected'
                          ? '❌ Verifikasi ditolak'
                          : verificationStatus === 'not_submitted'
                          ? '🔒 Verifikasi diperlukan' 
                          : `🔒 Lengkapi: ${missingBasicFields.join(', ')}`
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-6xl">🚀</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-lg font-bold text-gray-900">{taskStats.active}</div>
                  <div className="text-xs text-gray-500 font-medium">Aktif</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="text-lg font-bold text-gray-900">{taskStats.completed}</div>
                  <div className="text-xs text-gray-500 font-medium">Selesai</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-lg font-bold text-gray-900">{taskStats.pending}</div>
                  <div className="text-xs text-gray-500 font-medium">Pending</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="text-lg font-bold text-gray-900">{taskStats.rating}</div>
                  <div className="text-xs text-gray-500 font-medium">Rating</div>
                </div>
              </div>

              {/* My Active Tasks */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Tugas Berlangsung</h2>
                  <Link href="/riwayat?mode=employer" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                    Riwayat <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {myTasks.length > 0 ? (
                  <div className="space-y-3">
                    {myTasks.slice(0, 2).map((task) => (
                      <div key={task._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">{task.title}</div>
                            <div className="text-xs text-gray-500">{getCategoryLabel(task.category)}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            task.status === 'active' ? 'bg-green-100 text-green-700' : 
                            task.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.status === 'active' ? 'Active' : 
                             task.status === 'accepted' ? 'Accepted' : 
                             task.status === 'pending' ? 'Pending' : 
                             task.status === 'open' ? 'Open' : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {task.location || 'Lokasi tidak tersedia'}
                          </div>
                          <div className="flex items-center gap-1">
                            📅 Hari ini, 14:00
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="text-lg font-bold text-primary-600">
                            {formatCurrency(task.budget)}
                          </div>
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
                            <Link href={`/tugas/${task._id}`}>
                              <button className="bg-primary-100 text-primary-600 px-4 py-2 rounded-lg text-xs font-semibold">
                                Detail →
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="text-sm font-medium">Belum ada tugas aktif</div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/pekerja" className="bg-white rounded-xl p-5 text-center border-2 border-gray-100 transition-transform active:scale-95">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3">
                    🔍
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Cari Tasker</div>
                  <div className="text-xs text-gray-500">Temukan pekerja</div>
                </Link>
                <Link href={`/riwayat?mode=${activeTab === 'beri-kerja' ? 'employer' : 'worker'}`} className="bg-white rounded-xl p-5 text-center border-2 border-gray-100 transition-transform active:scale-95">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3">
                    📝
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Riwayat</div>
                  <div className="text-xs text-gray-500">Lihat semua tugas</div>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Cari Kerja Mode */}
              {/* Alert Card - Penghasilan */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border-l-4 border-blue-500">
                <div className="flex gap-3">
                  <div className="text-xl">💰</div>
                  <div>
                    <div className="text-sm font-semibold text-blue-800">Penghasilan Bulan Ini</div>
                    <div className="text-xs text-blue-700">Rp 2.450.000 dari 8 pekerjaan selesai</div>
                  </div>
                </div>
              </div>

              {/* Profile Incomplete Alert for Workers */}
              {verificationStatus === 'approved' && !canAccessFeatures && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 mb-6 border-l-4 border-yellow-500">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-yellow-800">Profil Belum Lengkap</div>
                      <div className="text-xs text-yellow-700 mb-2">
                        Lengkapi profil untuk melamar pekerjaan: {missingFields.join(', ')}
                      </div>
                      <Link href="/profil">
                        <Button size="sm" variant="outline" className="text-xs border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                          Lengkapi Profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Ketersediaan */}
              <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Status Ketersediaan</div>
                    <div className="text-xs text-gray-500">
                      {isAvailable ? 'Saat ini Anda sedang tersedia' : 'Saat ini Anda tidak tersedia'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`w-14 h-8 rounded-full relative transition-colors ${
                      isAvailable ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-transform shadow-sm ${
                      isAvailable ? 'right-1' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-4 gap-3 mb-7">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-lg font-bold text-gray-900">{workerStats.active}</div>
                  <div className="text-xs text-gray-500 font-medium">Aktif</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="text-lg font-bold text-gray-900">{workerStats.completed}</div>
                  <div className="text-xs text-gray-500 font-medium">Selesai</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">💵</div>
                  <div className="text-lg font-bold text-gray-900">2.4M</div>
                  <div className="text-xs text-gray-500 font-medium">Earning</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="text-lg font-bold text-gray-900">{workerStats.rating}</div>
                  <div className="text-xs text-gray-500 font-medium">Rating</div>
                </div>
              </div>

              {/* Active Worker Jobs */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Pekerjaan Berlangsung</h2>
                  <Link href="/riwayat?mode=worker" className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                    Riwayat <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {activeWorkerJobs.length > 0 ? (
                  <div className="space-y-3">
                    {activeWorkerJobs.map((job) => (
                      <div key={job._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">{job.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <span>{job.poster?.name || 'Anonymous'}</span>
                              {job.poster?.isVerified && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            job.isAssignedWorker && job.status === 'active' ? 'bg-green-100 text-green-700' : 
                            job.isAssignedWorker && job.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            !job.isAssignedWorker && job.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            job.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                            job.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {job.isAssignedWorker ? (
                              job.status === 'active' ? 'Sedang Berlangsung' : 
                              job.status === 'accepted' ? 'Diterima' : 
                              job.status === 'pending' ? 'Menunggu' : 
                              job.status === 'completed' ? 'Selesai' :
                              job.status === 'rejected' ? 'Ditolak' : 'Unknown'
                            ) : (
                              job.status === 'pending' ? 'Menunggu' :
                              job.status === 'accepted' ? 'Diterima' :
                              job.status === 'active' ? 'Sedang Berlangsung' :
                              job.status === 'completed' ? 'Selesai' :
                              job.status === 'rejected' ? 'Ditolak' : 'Unknown'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location || 'Lokasi tidak tersedia'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            }) : 'Tanggal belum ditentukan'}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="text-lg font-bold text-primary-600">
                            {formatCurrency(job.budget)}
                          </div>
                          <Link href={`/tugas/${job._id}`}>
                            <button className="bg-gray-100 text-primary-600 px-4 py-2 rounded-lg text-xs font-semibold">
                              Detail →
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                    <div className="text-4xl mb-3">💼</div>
                    <div className="text-sm font-medium">Belum ada pekerjaan aktif</div>
                    <div className="text-xs text-gray-400 mt-1">Terima pekerjaan untuk melihat progress di sini</div>
                  </div>
                )}
              </div>

              {/* Tab Section */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button 
                    onClick={() => setJobTab('permintaan')}
                    className={`py-3 px-4 border-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      jobTab === 'permintaan' 
                        ? 'border-primary-500 bg-gradient-to-r from-blue-50 to-blue-100 text-primary-600' 
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span className="text-lg">🔍</span>
                    Permintaan
                  </button>
                  <button 
                    onClick={() => setJobTab('publikasi')}
                    className={`py-3 px-4 border-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      jobTab === 'publikasi' 
                        ? 'border-primary-500 bg-gradient-to-r from-blue-50 to-blue-100 text-primary-600' 
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span className="text-lg">📢</span>
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

                {/* Available Jobs */}
                {jobTab === 'permintaan' ? (
                  offeredJobs.length > 0 ? (
                    <div className="space-y-3">
                      {offeredJobs.map((job) => (
                        <div key={job._id} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-l-4 border-green-500">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 mb-1">{job.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <span>{job.postedBy?.name || 'Anonymous'}</span>
                                <span className="text-primary-500">✓</span>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">
                              Ditawari
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              📍 {job.location || 'Lokasi tidak tersedia'} • 2.3 km
                            </div>
                            <div className="flex items-center gap-1">
                              📅 Besok, 09:00
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-green-200">
                            <div className="text-lg font-bold text-primary-600">
                              {formatCurrency(job.budget)}
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/pekerjaan/${job._id}?from=dashboard`}>
                                <button className="bg-white text-gray-600 border-2 border-gray-300 px-3 py-1 rounded-lg text-xs font-semibold">
                                  Detail
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleRejectOfferedJob(job._id)}
                                disabled={processingJobId === job._id || !canAccessFeatures}
                                className={`bg-white border-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                                  !canAccessFeatures 
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-red-600 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {processingJobId === job._id ? 'Menolak...' : 'Tolak'}
                              </button>
                              <button 
                                onClick={() => handleAcceptOfferedJob(job._id)}
                                disabled={processingJobId === job._id || !canAccessFeatures}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                  !canAccessFeatures
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg'
                                }`}
                                title={!canAccessFeatures ? 'Lengkapi profil untuk menerima pekerjaan' : ''}
                              >
                                {processingJobId === job._id ? 'Menerima...' : 'Terima'}
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
                    </div>
                  )
                ) : (
                  allJobs.length > 0 ? (
                    <div className="space-y-3">
                      {allJobs.map((job) => (
                        <Link key={job._id} href={`/pekerjaan/${job._id}?from=dashboard`}>
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 mb-1">{job.title}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>{job.poster?.name || job.postedBy?.name || 'Anonymous'}</span>
                                  {(job.poster?.isVerified || job.postedBy?.isVerified) && <span className="text-primary-500">✓</span>}
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                                📝 Publikasi
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                📍 {job.location || 'Lokasi tidak tersedia'}
                              </div>
                              <div className="flex items-center gap-1">
                                📅 {new Date(job.createdAt).toLocaleDateString('id-ID')}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                              <div className="text-lg font-bold text-primary-600">
                                {formatCurrency(job.budget)}
                              </div>
                              <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-shadow">
                                Lihat Detail
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {/* Show more link if there are jobs */}
                      <div className="text-center pt-2">
                        <Link href="/pekerjaan" className="text-sm text-primary-600 font-semibold hover:underline">
                          Lihat Semua Pekerjaan Publikasi →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                      <div className="text-4xl mb-3">📝</div>
                      <div className="text-sm font-medium">Belum ada pekerjaan publikasi tersedia</div>
                      <div className="text-xs text-gray-400 mt-1">Cek lagi nanti untuk pekerjaan baru</div>
                    </div>
                  )
                )}
              </div>
            </>
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
    </>
  );
}