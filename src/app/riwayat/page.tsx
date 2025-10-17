'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, Briefcase, UserCheck, Edit, Trash2 } from 'lucide-react';
import { CancelTaskModal } from '@/components/features/tasks/CancelTaskModal';

type TabType = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type ModeType = 'worker' | 'employer';

export default function HistoryPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') as ModeType;
  
  const [mode, setMode] = useState<ModeType>(modeParam || 'worker');
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [tasks, setTasks] = useState<any[]>([]);
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

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session, activeTab, mode]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let endpoint = '/api/worker-jobs'; // Default for worker mode
      
      if (mode === 'employer') {
        // For employer mode, get tasks they created
        endpoint = '/api/my-tasks';
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log(`History API response (${mode} mode):`, data);
      
      if (data.success) {
        // Filter based on active tab and mode
        let filteredTasks = data.data;
        
        if (mode === 'employer') {
          // For employer: filter based on task status and applicant acceptance
          console.log('All tasks before filtering:', data.data.map((t: any) => ({ 
            title: t.title, 
            status: t.status, 
            assignedTo: t.assignedTo,
            assignedToType: typeof t.assignedTo,
            assignedToKeys: t.assignedTo ? Object.keys(t.assignedTo) : 'null'
          })));
          
          switch (activeTab) {
            case 'pending':
              // Show tasks that are open (waiting for applicants) OR pending (waiting for worker confirmation)
              filteredTasks = data.data.filter((task: any) => 
                task.status === 'open' || task.status === 'pending'
              );
              console.log('Pending filtered tasks:', filteredTasks.map((t: any) => ({ 
                title: t.title, 
                status: t.status, 
                assignedTo: t.assignedTo 
              })));
              break;
            case 'in_progress':
              // Tasks that have been assigned and are in progress (pending, accepted, active)
              filteredTasks = data.data.filter((task: any) => 
                ['pending', 'accepted', 'active', 'proses'].includes(task.status) && task.assignedTo !== null
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
          }
        } else {
          // For worker mode: filter based on assignment status and application status
          switch (activeTab) {
            case 'pending':
              filteredTasks = data.data.filter((task: any) => 
                task.applicationStatus === 'pending'
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
          }
        }
        
        console.log(`Filtered tasks for tab '${activeTab}' in ${mode} mode:`, filteredTasks);
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
        // Refresh the tasks list
        fetchTasks();
        setCancelModal({ isOpen: false, taskId: '', taskTitle: '' });
      } else {
        alert('Gagal membatalkan tugas: ' + data.error);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      alert('Terjadi kesalahan saat membatalkan tugas');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold mb-4">Riwayat Tugas</h1>

            {/* Mode Switcher */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setMode('employer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'employer'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Sebagai Pemberi Kerja</span>
              </button>
              <button
                onClick={() => setMode('worker')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'worker'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Sebagai Pekerja</span>
              </button>
            </div>

            {/* Status Tabs */}
            <div className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.value
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
                  Belum ada tugas {getStatusLabel(activeTab)} 
                  {mode === 'employer' ? ' yang Anda buat' : ' yang Anda kerjakan'}
                </p>
                {mode === 'employer' ? (
                  <Link href="/tugas/buat">
                    <Button className="mt-4">Buat Tugas Baru</Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button className="mt-4">Cari Pekerjaan</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task._id}>
                  {activeTab === 'in_progress' ? (
                    // Special layout for in_progress tab
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
                          <div className="flex items-center space-x-1">
                            <span>📅</span>
                            <span>{formatDate(task.scheduledDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>⏱️</span>
                            <span>{task.estimatedDuration || '2-3 jam'}</span>
                          </div>
                        </div>

                        {mode === 'employer' ? (
                          // Employer view - show worker info
                          task.assignedTo ? (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {task.assignedTo.name ? task.assignedTo.name.substring(0, 2).toUpperCase() : 'NA'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {task.assignedTo.name || 'Tidak diketahui'}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <span className="text-yellow-500">⭐</span>
                                    <span>{task.assignedTo.rating || '4.8'} (120+ ulasan)</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                                </div>
                                <div className="text-xs text-gray-600 text-center">
                                  Estimasi selesai dalam 2 jam
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  💬 Chat
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  📞 Telepon
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  📍 Lacak
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 rounded-lg p-3 mb-4 text-center text-sm text-yellow-700">
                              Menunggu pekerja memulai tugas
                            </div>
                          )
                        ) : (
                          // Worker view - show employer info and progress
                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {task.poster ? task.poster.name.substring(0, 2).toUpperCase() : 'NA'}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm">
                                  {task.poster?.name || 'Tidak diketahui'}
                                </div>
                                <div className="text-xs text-gray-600">✓ Terverifikasi</div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Progress Pekerjaan</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>60% selesai</span>
                                <span>1.5 jam tersisa</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-lg font-bold text-primary-600">
                            {formatCurrency(task.budget)}
                          </span>
                          <div className="flex gap-2">
                            {mode === 'employer' ? (
                              <>
                                <Link href={`/tugas/${task._id}`}>
                                  <Button variant="outline" size="sm">Detail</Button>
                                </Link>
                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                                  Konfirmasi Selesai
                                </Button>
                              </>
                            ) : (
                              <>
                                <Link href={`/tugas/${task._id}`}>
                                  <Button variant="outline" size="sm">Chat</Button>
                                </Link>
                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                                  Selesai
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {mode === 'worker' && (
                          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                            <Button variant="outline" size="sm" className="text-xs flex flex-col items-center py-2 h-auto">
                              <span className="text-base mb-1">📍</span>
                              <span>Navigasi</span>
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs flex flex-col items-center py-2 h-auto">
                              <span className="text-base mb-1">📞</span>
                              <span>Telepon</span>
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs flex flex-col items-center py-2 h-auto">
                              <span className="text-base mb-1">📄</span>
                              <span>Perjanjian</span>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    // Default layout for other tabs
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
                            className={`text-xs px-2 py-1 rounded-full ${
                              mode === 'worker' && task.applicationStatus 
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
                            <span>{formatDate(task.scheduledDate)}</span>
                          </div>
                          {mode === 'employer' && (
                            <div className="flex items-center space-x-1">
                              <span>👥</span>
                              <span>{task.applicants || 0} pelamar</span>
                            </div>
                          )}
                        </div>

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
              ))}
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
    </>
  );
}
