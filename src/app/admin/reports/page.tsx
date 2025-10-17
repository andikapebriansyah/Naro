'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  FileText,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Shield,
  Ban,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewing' | 'resolved' | 'rejected' | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState<'warning' | 'suspend_reported' | 'refund' | 'no_action'>('no_action');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Akses ditolak');
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?status=${activeTab}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedReport(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat detail laporan');
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Mohon isi keputusan resolusi');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport._id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, adminNotes, action }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Laporan berhasil diselesaikan');
        setShowResolveModal(false);
        setSelectedReport(null);
        setResolution('');
        setAdminNotes('');
        setAction('no_action');
        fetchReports();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Gagal menyelesaikan laporan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Mohon isi alasan penolakan');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Laporan tidak valid', adminNotes }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Laporan ditolak');
        setShowRejectModal(false);
        setSelectedReport(null);
        setAdminNotes('');
        fetchReports();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Gagal menolak laporan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      worker_no_show: '❌ Pekerja Tidak Datang',
      work_quality_poor: '⚠️ Kualitas Pekerjaan Buruk',
      work_incomplete: '📋 Pekerjaan Tidak Selesai',
      unprofessional: '😠 Sikap Tidak Profesional',
      damage_property: '💔 Merusak Properti',
      late_arrival: '⏰ Datang Terlambat',
      payment_not_received: '💰 Pembayaran Tidak Diterima',
      payment_less: '💸 Pembayaran Kurang',
      unsafe_workplace: '⚠️ Tempat Kerja Tidak Aman',
      job_not_match: '📋 Pekerjaan Tidak Sesuai',
      harassment: '😠 Pelecehan/Intimidasi',
      unreasonable_demand: '❗ Permintaan Tidak Masuk Akal',
      contract_breach: '📄 Melanggar Perjanjian',
      safety_violation: '⚠️ Pelanggaran Keselamatan',
      no_show_employer: '❌ Pemberi Kerja Tidak Ada',
      other: '📝 Lainnya',
    };
    return reasonMap[reason] || reason;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'reviewing', label: 'Reviewing', icon: Eye },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
    { value: 'all', label: 'Semua', icon: FileText },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Kelola Laporan</h1>
                  <p className="text-gray-600">Review dan selesaikan laporan dari pengguna</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    activeTab === tab.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada laporan {activeTab !== 'all' ? activeTab : ''}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report._id} className="hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{report.taskId?.title || 'Task Deleted'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Pelapor:</span>
                            <span>{report.reporterId?.name} ({report.reporterType})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium">Dilaporkan:</span>
                            <span>{report.reportedUserId?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Alasan:</span>
                            <span>{getReasonLabel(report.reason)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(report.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleViewDetail(report._id)} size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Detail Laporan</h2>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedReport.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Task Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Informasi Tugas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Judul:</strong> {selectedReport.taskId?.title}</div>
                    <div><strong>Kategori:</strong> {selectedReport.taskId?.category}</div>
                    <div><strong>Lokasi:</strong> {selectedReport.taskId?.location}</div>
                    <div><strong>Budget:</strong> Rp {selectedReport.taskId?.budget?.toLocaleString('id-ID')}</div>
                    <div><strong>Status Task:</strong> {selectedReport.taskId?.status}</div>
                  </CardContent>
                </Card>

                {/* Reporter & Reported */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pelapor ({selectedReport.reporterType})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Nama:</strong> {selectedReport.reporterId?.name}</div>
                      <div><strong>Email:</strong> {selectedReport.reporterId?.email}</div>
                      <div><strong>Phone:</strong> {selectedReport.reporterId?.phone || '-'}</div>
                      <div><strong>Verified:</strong> {selectedReport.reporterId?.isVerified ? '✓ Ya' : '✗ Tidak'}</div>
                      <div><strong>Rating:</strong> ⭐ {selectedReport.reporterId?.rating || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Yang Dilaporkan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Nama:</strong> {selectedReport.reportedUserId?.name}</div>
                      <div><strong>Email:</strong> {selectedReport.reportedUserId?.email}</div>
                      <div><strong>Phone:</strong> {selectedReport.reportedUserId?.phone || '-'}</div>
                      <div><strong>Verified:</strong> {selectedReport.reportedUserId?.isVerified ? '✓ Ya' : '✗ Tidak'}</div>
                      <div><strong>Rating:</strong> ⭐ {selectedReport.reportedUserId?.rating || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Report Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Detail Laporan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <strong>Alasan:</strong>
                      <div className="mt-1 text-lg">{getReasonLabel(selectedReport.reason)}</div>
                    </div>
                    <div>
                      <strong>Deskripsi:</strong>
                      <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
                    </div>
                    {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                      <div>
                        <strong>Bukti Pendukung ({selectedReport.evidence.length}):</strong>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {selectedReport.evidence.map((url: string, idx: number) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                              {url.endsWith('.pdf') ? (
                                <div className="bg-red-100 rounded-lg p-4 text-center hover:bg-red-200">
                                  <FileText className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                  <span className="text-xs">PDF {idx + 1}</span>
                                </div>
                              ) : (
                                <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-24 object-cover rounded-lg hover:opacity-80" />
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button onClick={() => setShowResolveModal(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve Laporan
                    </Button>
                    <Button onClick={() => setShowRejectModal(true)} variant="outline" className="flex-1 text-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak Laporan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-bold mb-4">Resolve Laporan</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tindakan</label>
                  <select value={action} onChange={(e) => setAction(e.target.value as any)} className="w-full border rounded-lg p-2">
                    <option value="no_action">Tidak Ada Tindakan</option>
                    <option value="warning">Peringatan kepada yang dilaporkan</option>
                    <option value="suspend_reported">Suspend User yang Dilaporkan</option>
                    <option value="refund">Refund & Batalkan Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Keputusan Resolusi *</label>
                  <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full border rounded-lg p-2" placeholder="Jelaskan keputusan dan tindakan yang diambil..." />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catatan Admin (Internal)</label>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="w-full border rounded-lg p-2" placeholder="Catatan internal untuk admin lain..." />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowResolveModal(false)} variant="outline" className="flex-1" disabled={isProcessing}>
                  Batal
                </Button>
                <Button onClick={handleResolve} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolve'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-bold mb-4">Tolak Laporan</h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Menolak laporan akan mengembalikan status task ke aktif dan tidak ada tindakan yang diambil.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Alasan Penolakan *</label>
                  <textarea 
                    value={adminNotes} 
                    onChange={(e) => setAdminNotes(e.target.value)} 
                    rows={4} 
                    className="w-full border rounded-lg p-2" 
                    placeholder="Jelaskan mengapa laporan ini ditolak (misalnya: tidak cukup bukti, laporan tidak valid, dll)..." 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setShowRejectModal(false)} 
                  variant="outline" 
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleReject} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tolak Laporan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}