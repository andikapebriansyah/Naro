'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Star, CheckCircle, Users, AlertCircle, Edit, Eye, FileText, Download, Search, MessageSquare, Phone, Navigation, X } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { PDFPreview } from '@/components/features/tasks/PDFPreview';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showAgreementPreview, setShowAgreementPreview] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);
  const [isCancellingAssignment, setIsCancellingAssignment] = useState(false);

  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
      } else {
        toast.error('Tugas tidak ditemukan');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Gagal memuat detail tugas');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptApplicant = async (applicantUserId: string) => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/accept-applicant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantUserId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Pelamar berhasil diterima!');
        fetchTaskDetail();
      } else {
        toast.error(data.error || 'Gagal menerima pelamar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menerima pelamar');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectApplicant = async (applicantUserId: string) => {
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/reject-applicant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantUserId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Pelamar berhasil ditolak');
        fetchTaskDetail();
      } else {
        toast.error(data.error || 'Gagal menolak pelamar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menolak pelamar');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancelAssignment = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan penugasan ke pekerja ini? Anda dapat memilih pekerja lain.')) {
      return;
    }

    setIsCancellingAssignment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: null,
          status: 'open'
        }),
      });

      if (response.ok) {
        toast.success('Penugasan berhasil dibatalkan');
        fetchTaskDetail();
      } else {
        toast.error('Gagal membatalkan penugasan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsCancellingAssignment(false);
    }
  };

  const handleCompleteTask = async (completedBy: 'worker' | 'employer', forceComplete = false) => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completedBy, forceComplete }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchTaskDetail();
        setShowCompletionConfirm(false);
      } else {
        toast.error(data.error || 'Gagal menyelesaikan tugas');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyelesaikan tugas');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleApproveCompletion = async (approve: boolean) => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/approve-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchTaskDetail();
      } else {
        toast.error(data.error || 'Gagal memproses persetujuan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses persetujuan');
    } finally {
      setIsApproving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      draft: 'Draft',
      open: 'Terbuka',
      pending: 'Menunggu',
      in_progress: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const isOwner = session?.user?.id === task?.posterId?._id;

  const generateAgreementContent = () => {
    if (!task) return '';
    
    return `
SURAT PERJANJIAN KERJA
Nomor: SPK/${task._id?.slice(-8)?.toUpperCase()}/2024

Yang bertanda tangan di bawah ini:

PIHAK PERTAMA (PEMBERI KERJA):
Nama       : ${task.posterId?.name || '[Nama Pemberi Kerja]'}
Email      : ${task.posterId?.email || '[Email Pemberi Kerja]'}
Telepon    : ${task.posterId?.phone || '[Telepon Pemberi Kerja]'}

PIHAK KEDUA (PEKERJA):
Nama       : ${task.assignedTo?.name || '[Nama Pekerja]'}
Email      : ${task.assignedTo?.email || '[Email Pekerja]'}
Telepon    : ${task.assignedTo?.phone || '[Telepon Pekerja]'}

Dengan ini sepakat mengadakan perjanjian kerja dengan ketentuan:

PASAL 1 - RUANG LINGKUP PEKERJAAN
1. Jenis Pekerjaan: ${task.title}
2. Kategori: ${getCategoryLabel(task.category)}
3. Deskripsi: ${task.description}
4. Lokasi: ${task.location}

PASAL 2 - WAKTU PELAKSANAAN
1. Tanggal Mulai: ${formatDate(task.startDate || task.scheduledDate)}
2. Waktu Mulai: ${task.startTime || task.scheduledTime} WIB
3. Tanggal Selesai: ${task.endDate ? formatDate(task.endDate) : 'Sesuai durasi pekerjaan'}
4. Waktu Selesai: ${task.endTime || '17:00'} WIB
5. Estimasi Durasi: ${task.estimatedDuration || 'Sesuai kebutuhan'}

PASAL 3 - KOMPENSASI
1. Nilai Kontrak: ${formatCurrency(task.budget)}
2. Tipe Pembayaran: ${task.pricingType === 'fixed' ? 'Harga Tetap' : 
   task.pricingType === 'hourly' ? 'Per Jam' :
   task.pricingType === 'daily' ? 'Per Hari' :
   task.pricingType === 'weekly' ? 'Per Minggu' :
   task.pricingType === 'monthly' ? 'Per Bulan' : 'Sesuai Kesepakatan'}
3. Pembayaran dilakukan setelah pekerjaan selesai dan diverifikasi

PASAL 4 - KEWAJIBAN PIHAK PERTAMA
1. Menyediakan akses lokasi kerja sesuai jadwal
2. Memberikan informasi lengkap tentang pekerjaan
3. Melakukan pembayaran sesuai kesepakatan
4. Menyediakan fasilitas yang diperlukan (jika ada)

PASAL 5 - KEWAJIBAN PIHAK KEDUA
1. Melaksanakan pekerjaan sesuai spesifikasi
2. Hadir tepat waktu sesuai jadwal
3. Menjaga keamanan dan kebersihan lokasi
4. Menggunakan alat dan bahan dengan hati-hati
5. Melaporkan progress pekerjaan secara berkala

PASAL 6 - KETENTUAN KHUSUS
1. Jika terjadi force majeure, kedua belah pihak akan bermusyawarah
2. Perubahan scope pekerjaan harus disepakati bersama
3. Penyelesaian sengketa melalui musyawarah mufakat
4. Perjanjian ini berlaku sejak ditandatangani

Demikian perjanjian ini dibuat dalam keadaan sadar dan tanpa paksaan.

Banda Aceh, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

PIHAK PERTAMA                    PIHAK KEDUA


(_________________)               (_________________)
${task.posterId?.name || '[Nama Pemberi Kerja]'}                  ${task.assignedTo?.name || '[Nama Pekerja]'}
`;
  };

  if (isLoading || !task) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 border-b-2 border-primary-600 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">Detail Tugas</h1>
                <p className="text-sm text-gray-600">Informasi lengkap tugas Anda</p>
              </div>
              {isOwner && task.status === 'draft' && (
                <Link href={`/tugas/buat?edit=${taskId}`}>
                  <Button size="sm" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Task Header */}
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{task.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-block px-2 sm:px-3 py-1 bg-primary-100 text-primary-700 text-xs sm:text-sm rounded-full">
                      {getCategoryLabel(task.category)}
                    </span>
                    <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    {task.searchMethod && (
                      <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-full">
                        {task.searchMethod === 'publication' ? 'Publikasi' : 'Cari Pekerja'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    Dibuat: {new Date(task.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-left lg:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">
                    {formatCurrency(task.budget)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {task.pricingType === 'fixed' ? 'Total' : 
                     task.pricingType === 'hourly' ? 'Per Jam' :
                     task.pricingType === 'daily' ? 'Per Hari' :
                     task.pricingType === 'weekly' ? 'Per Minggu' :
                     task.pricingType === 'monthly' ? 'Per Bulan' : 'Total'}
                  </div>
                </div>
              </div>

              {/* Task Meta - Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">Lokasi:</span>
                    <span className="text-sm text-gray-900">{task.location}</span>
                  </div>
                  {task.locationCoordinates && task.locationCoordinates.lat !== 0 && (
                    <div className="flex items-center space-x-2 ml-7">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        GPS: {task.locationCoordinates.lat.toFixed(6)}, {task.locationCoordinates.lng.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">Mulai:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(task.startDate || task.scheduledDate)} - {task.startTime || task.scheduledTime} WIB
                    </span>
                  </div>
                  {task.endDate && (
                    <div className="flex items-center space-x-2 ml-7">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-700">
                        Selesai: {formatDate(task.endDate)} - {task.endTime || '17:00'} WIB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Description - Enhanced */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Deskripsi Tugas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{task.description}</p>
              
              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {task.estimatedDuration && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Durasi:</span>
                    </div>
                    <span className="text-sm text-blue-700 ml-6">{task.estimatedDuration}</span>
                  </div>
                )}
                
                {task.workerCount && task.workerCount > 1 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Pekerja:</span>
                    </div>
                    <span className="text-sm text-green-700 ml-6">{task.workerCount} orang</span>
                  </div>
                )}
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Tipe:</span>
                  </div>
                  <span className="text-sm text-purple-700 ml-6">
                    {task.pricingType === 'fixed' ? 'Harga Tetap' : 
                     task.pricingType === 'hourly' ? 'Per Jam' :
                     task.pricingType === 'daily' ? 'Per Hari' :
                     task.pricingType === 'weekly' ? 'Per Minggu' :
                     task.pricingType === 'monthly' ? 'Per Bulan' : 'Harga Tetap'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {task.photos && task.photos.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Foto Referensi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {task.photos.map((photo: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={photo} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agreement Preview */}
          {(task.assignedTo || task.status !== 'draft') && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Surat Perjanjian</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.assignedTo ? (
                  <PDFPreview 
                    task={task}
                    clauses={task.agreement?.clauses || []}
                    customClauses={task.agreement?.customClauses || ''}
                    posterName={task.posterId?.name || ''}
                    showDownloadButton={true}
                  />
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 px-4">
                      Surat perjanjian akan dibuat otomatis setelah pekerja ditugaskan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Worker - Enhanced */}
          {task.assignedTo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Pekerja yang Ditugaskan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base sm:text-lg break-words">{task.assignedTo.name}</h3>
                      {task.assignedTo.isVerified && (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {task.assignedTo.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
                        <span className="font-medium text-sm sm:text-base">{task.assignedTo.rating}</span>
                        <span className="text-gray-600 text-xs sm:text-sm">(rating)</span>
                      </div>
                    )}
                    <div className="text-xs sm:text-sm text-gray-600 break-all">
                      {task.assignedTo.email}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                    <div className={`text-sm font-medium text-center px-3 py-1 rounded ${
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.status === 'pending' ? 'Menunggu Konfirmasi' : 'Ditugaskan'}
                    </div>
                    {isOwner && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>Chat</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>Call</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status for Worker - Waiting for Confirmation */}
          {!isOwner && task.assignedTo && task.assignedTo._id === session?.user?.id && task.status === 'pending' && (
            <Card className="mb-6 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span>Penawaran Tugas Menunggu Konfirmasi Anda</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-3">
                      <span className="font-semibold">{task.posterId?.name}</span> telah memilih Anda untuk mengerjakan tugas ini berdasarkan rekomendasi sistem AI.
                    </p>
                    <p className="text-sm text-blue-700 mb-3">
                      Anda sekarang menunggu konfirmasi dari pemberi kerja untuk memulai pekerjaan. Pemberi kerja akan:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-2 ml-4">
                      <li>✓ <span className="font-medium">Menerima penawaran</span> - Pekerjaan akan dimulai sesuai jadwal</li>
                      <li>✗ <span className="font-medium">Mencari pekerja lain</span> - Penugasan dibatalkan</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-l-amber-500 bg-amber-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">Waktu Tunggu</p>
                        <p className="text-sm text-amber-700">
                          Pemberi kerja biasanya merespons dalam waktu 24 jam. Anda akan menerima notifikasi ketika ada keputusan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900 mb-2">Detail Tugas</p>
                    <div className="text-sm text-green-700 space-y-2">
                      <p><span className="font-medium">Jadwal:</span> {formatDate(task.startDate || task.scheduledDate)} - {task.startTime || task.scheduledTime} WIB</p>
                      <p><span className="font-medium">Budget:</span> {formatCurrency(task.budget)}</p>
                      <p><span className="font-medium">Lokasi:</span> {task.location}</p>
                    </div>
                  </div>

                  <Link href={`/tugas/${taskId}`}>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Detail Tugas Lengkap
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applicants - Only visible to task owner and for publication method */}
          {isOwner && task.searchMethod === 'publication' && task.applicants && task.applicants.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Pelamar ({task.applicants.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.applicants.map((applicant: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {getInitials(applicant.user?.name || 'Pelamar')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="font-medium">{applicant.user?.name}</div>
                          {applicant.user?.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        {applicant.message && (
                          <p className="text-sm text-gray-600 mb-1">{applicant.message}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          Melamar {new Date(applicant.appliedAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {applicant.status !== 'pending' && (
                          <div className={`text-xs px-2 py-1 rounded text-center ${
                            applicant.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {applicant.status === 'accepted' ? 'Diterima' : 'Ditolak'}
                          </div>
                        )}
                        <div className="flex space-x-1">
                          <Link href={`/pekerja/${applicant.user?._id || applicant.userId}`}>
                            <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7">
                              <User className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                          </Link>
                          {applicant.status === 'pending' && isOwner && !task.assignedTo && (
                            <>
                              <Button 
                                size="sm" 
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => handleAcceptApplicant(applicant.user?._id || applicant.userId)}
                                disabled={isAccepting}
                              >
                                {isAccepting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Terima'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs px-2 py-1 h-7"
                                onClick={() => handleRejectApplicant(applicant.user?._id || applicant.userId)}
                                disabled={isRejecting}
                              >
                                {isRejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tolak'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status for Find_Worker Method - Waiting for Worker Confirmation */}
          {isOwner && task.searchMethod === 'find_worker' && task.assignedTo && task.status === 'pending' && (
            <Card className="mb-6 border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span>Menunggu Konfirmasi Pekerja</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Main Status Explanation */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700 mb-3">
                      Tugas Anda telah ditawarkan kepada <span className="font-semibold">{task.assignedTo.name}</span> melalui sistem rekomendasi AI berdasarkan keahlian, pengalaman, dan lokasi mereka yang sesuai dengan kebutuhan tugas Anda.
                    </p>
                    <p className="text-sm text-amber-700">
                      <span className="font-medium">Status Saat Ini:</span> Menunggu pekerja merespons penawaran tugas ini.
                    </p>
                  </div>

                  {/* What Happens Next */}
                  <div className="border-l-4 border-l-purple-500 bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-900 mb-3">Apa Yang Akan Terjadi Selanjutnya:</p>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 text-xs font-bold flex-shrink-0">1</div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Pekerja Menerima Notifikasi</p>
                          <p className="text-xs text-purple-700">Pekerja akan menerima pemberitahuan tentang penawaran tugas ini di dashboard mereka</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 text-xs font-bold flex-shrink-0">2</div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Pekerja Membuat Keputusan</p>
                          <p className="text-xs text-purple-700">Pekerja dapat memilih untuk menerima atau menolak penawaran ini dalam waktu 24 jam</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 text-xs font-bold flex-shrink-0">3</div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Pekerjaan Dimulai</p>
                          <p className="text-xs text-purple-700">Jika diterima, pekerjaan akan dimulai sesuai jadwal yang ditentukan: <span className="font-semibold">{formatDate(task.startDate || task.scheduledDate)} - {task.startTime || task.scheduledTime} WIB</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Worker Information */}
                  <div className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-3">Profil Pekerja Terpilih</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-blue-700">Nama:</span>
                        <span className="text-sm font-semibold text-blue-900">{task.assignedTo.name}</span>
                      </div>
                      {task.assignedTo.rating && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700">Rating:</span>
                          <span className="text-sm font-semibold text-blue-900">{task.assignedTo.rating} ⭐</span>
                        </div>
                      )}
                      {task.assignedTo.isVerified && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-blue-700">Status:</span>
                          <span className="text-sm font-semibold text-blue-900 flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span>Terverifikasi</span>
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-blue-700">Email:</span>
                        <span className="text-sm text-blue-900 break-all">{task.assignedTo.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">Waktu Tunggu Respons</p>
                      <p className="mb-2">
                        Pekerja memiliki waktu hingga <span className="font-semibold">24 jam</span> untuk merespons penawaran tugas ini. Anda akan menerima notifikasi ketika mereka membuat keputusan.
                      </p>
                      <p className="text-xs">
                        Jika pekerja tidak merespons dalam 24 jam, Anda dapat membatalkan penugasan dan memilih pekerja lain dari hasil rekomendasi.
                      </p>
                    </div>
                  </div>

                  {/* What If Options */}
                  <div className="border-l-4 border-l-green-500 bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-3">Skenario Kemungkinan:</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-green-700">✓ Jika Diterima:</p>
                        <p className="text-xs text-green-700">Pekerjaan akan secara otomatis dimulai pada jadwal yang ditentukan. Pekerja harus hadir tepat waktu di lokasi yang ditentukan.</p>
                      </div>
                      <div className="pt-2 border-t border-green-200">
                        <p className="text-sm font-medium text-green-700">✗ Jika Ditolak:</p>
                        <p className="text-xs text-green-700">Penugasan akan dibatalkan. Anda dapat memilih pekerja lain atau mencari melalui sistem rekomendasi AI kembali.</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/pekerja/${task.assignedTo._id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Lihat Profil Lengkap Pekerja
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleCancelAssignment}
                      disabled={isCancellingAssignment}
                    >
                      {isCancellingAssignment ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Batal Penugasan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Actions - Enhanced with conditional logic */}
          {isOwner && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Aksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 flex-col">
                  {task.status === 'draft' && (
                    <>
                      {task.searchMethod === 'find_worker' ? (
                        <Link href={`/tugas/${taskId}/cari-pekerja`}>
                          <Button className="flex items-center space-x-2 w-full">
                            <Search className="h-4 w-4" />
                            <span>Cari Pekerja dengan AI</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/tugas/${taskId}/perjanjian`}>
                          <Button className="flex items-center space-x-2 w-full">
                            <FileText className="h-4 w-4" />
                            <span>Lanjutkan ke Publikasi</span>
                          </Button>
                        </Link>
                      )}
                      <Link href={`/tugas/${taskId}/edit`}>
                        <Button variant="outline" className="flex items-center space-x-2 w-full">
                          <Edit className="h-4 w-4" />
                          <span>Edit Tugas</span>
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {/* For find_worker method - show search workers action when no one assigned yet */}
                  {task.status === 'open' && !task.assignedTo && task.searchMethod === 'find_worker' && (
                    <Link href={`/tugas/${taskId}/cari-pekerja`}>
                      <Button className="flex items-center space-x-2 w-full">
                        <Search className="h-4 w-4" />
                        <span>Cari Pekerja Lagi</span>
                      </Button>
                    </Link>
                  )}

                  {/* For publication method - show publication status info */}
                  {task.status === 'open' && !task.assignedTo && task.searchMethod === 'publication' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 w-full">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Tugas Dipublikasikan</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Tugas Anda telah dipublikasikan. Tunggu pelamar dan pilih yang terbaik dari daftar pelamar di atas.
                      </p>
                      {(!task.applicants || task.applicants.length === 0) && (
                        <p className="text-xs text-blue-600">
                          Belum ada pelamar. Tugas akan muncul di halaman pencarian pekerja.
                        </p>
                      )}
                    </div>
                  )}

                  {task.status === 'accepted' && task.assignedTo && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 w-full">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Siap Dimulai</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Pekerja telah menerima penugasan. Pekerjaan akan otomatis dimulai sesuai jadwal yang ditentukan: {formatDate(task.startDate || task.scheduledDate)} - {task.startTime || task.scheduledTime} WIB.
                      </p>
                    </div>
                  )}

                  {['active', 'accepted'].includes(task.status) && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 w-full">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Pekerjaan Sedang Berlangsung</span>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Pekerja sedang mengerjakan tugas ini. Pekerjaan akan selesai sesuai estimasi waktu yang ditentukan.
                      </p>
                      <div className="flex gap-3">
                        {isOwner && (
                          <Button 
                            onClick={() => setShowCompletionConfirm(true)}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Selesaikan Tugas
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {task.status === 'completed_worker' && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 w-full">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-900">Menunggu Persetujuan Penyelesaian</span>
                      </div>
                      <p className="text-sm text-amber-700 mb-3">
                        Pekerja telah menandai tugas sebagai selesai. Silakan tinjau hasil pekerjaan dan berikan persetujuan.
                      </p>
                      {isOwner && (
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => handleApproveCompletion(true)}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isApproving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Setujui & Bayar
                          </Button>
                          <Button 
                            onClick={() => handleApproveCompletion(false)}
                            disabled={isApproving}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 w-full">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Tugas Selesai</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Tugas telah diselesaikan dengan sukses. Pembayaran telah diproses.
                      </p>
                      {task.completedAt && (
                        <div className="text-xs text-green-600 mt-2">
                          Selesai pada: {new Date(task.completedAt).toLocaleDateString('id-ID')} - {new Date(task.completedAt).toLocaleTimeString('id-ID')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit button for draft/open/pending status */}
                  {['draft', 'open', 'pending'].includes(task.status) && !task.assignedTo && (
                    <Link href={`/tugas/${taskId}/edit`}>
                      <Button variant="outline" className="flex items-center space-x-2 w-full">
                        <Edit className="h-4 w-4" />
                        <span>Edit Tugas</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isOwner && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Akses Terbatas</p>
                    <p className="text-sm text-orange-700">
                      Anda tidak memiliki akses untuk mengelola tugas ini
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completion Confirmation Modal */}
        {showCompletionConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Penyelesaian</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-3">
                  Anda akan menyelesaikan tugas ini secara sepihak. Pekerja akan langsung menerima pembayaran sebesar:
                </p>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xl font-bold text-green-700 text-center">
                    {formatCurrency(task.budget)}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * Tindakan ini tidak dapat dibatalkan. Pastikan Anda yakin dengan keputusan ini.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompletionConfirm(false)}
                  disabled={isCompleting}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleCompleteTask('employer', true)}
                  disabled={isCompleting}
                >
                  {isCompleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Ya, Selesaikan
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}