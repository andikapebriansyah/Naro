'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Star, CheckCircle, Users, AlertCircle, Edit, Eye, FileText, Download, Search, MessageSquare, Phone, Navigation } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

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
        fetchTaskDetail(); // Refresh data
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
        fetchTaskDetail(); // Refresh data
      } else {
        toast.error(data.error || 'Gagal menolak pelamar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menolak pelamar');
    } finally {
      setIsRejecting(false);
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
4. Waktu Selesai: ${task.endTime || 'Sesuai kesepakatan'} WIB
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
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                      {getCategoryLabel(task.category)}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    {task.searchMethod && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {task.searchMethod === 'publication' ? '📢 Publikasi' : '🔍 Cari Pekerja'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
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
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatCurrency(task.budget)}
                  </div>
                  <div className="text-sm text-gray-500">
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
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Surat Perjanjian</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAgreementPreview ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
                        {generateAgreementContent()}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAgreementPreview(false)}
                      >
                        Tutup Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => {
                          const content = generateAgreementContent();
                          const blob = new Blob([content], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Surat_Perjanjian_${task._id?.slice(-8)}.txt`;
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Surat perjanjian akan dibuat otomatis setelah pekerja ditugaskan
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAgreementPreview(true)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview Surat Perjanjian</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Worker - Enhanced */}
          {task.assignedTo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pekerja yang Ditugaskan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                  <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(task.assignedTo.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-lg">{task.assignedTo.name}</h3>
                      {task.assignedTo.isVerified && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    {task.assignedTo.rating && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{task.assignedTo.rating}</span>
                        <span className="text-gray-600 text-sm">(rating)</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {task.assignedTo.email}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="text-sm text-green-700 font-medium text-center">Ditugaskan</div>
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
                        {/* Only show status if not pending */}
                        {applicant.status !== 'pending' && (
                          <div className={`text-xs px-2 py-1 rounded text-center ${
                            applicant.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {applicant.status === 'accepted' ? 'Diterima' : 'Ditolak'}
                          </div>
                        )}
                        <div className="flex space-x-1">
                          {/* Detail User Button */}
                          <Link href={`/pekerja/${applicant.user?._id || applicant.userId}`}>
                            <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7">
                              <User className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                          </Link>
                          {/* Accept/Reject buttons for pending applicants */}
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

          {/* Status Actions - Enhanced with conditional logic */}
          {isOwner && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Aksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {task.status === 'draft' && (
                    <>
                      {task.searchMethod === 'find_worker' ? (
                        <Link href={`/tugas/${taskId}/cari-pekerja`}>
                          <Button className="flex items-center space-x-2">
                            <Search className="h-4 w-4" />
                            <span>Cari Pekerja</span>
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/tugas/${taskId}/perjanjian`}>
                          <Button className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Lanjutkan ke Publikasi</span>
                          </Button>
                        </Link>
                      )}
                      <Link href={`/tugas/${taskId}/edit`}>
                        <Button variant="outline" className="flex items-center space-x-2">
                          <Edit className="h-4 w-4" />
                          <span>Edit Tugas</span>
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {/* For find_worker method - show search workers action */}
                  {task.status === 'open' && !task.assignedTo && task.searchMethod === 'find_worker' && (
                    <Link href={`/tugas/${taskId}/cari-pekerja`}>
                      <Button className="flex items-center space-x-2">
                        <Search className="h-4 w-4" />
                        <span>Cari Pekerja</span>
                      </Button>
                    </Link>
                  )}

                  {/* For publication method - don't show search action, just manage applicants */}
                  {task.status === 'open' && !task.assignedTo && task.searchMethod === 'publication' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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

                  {task.status === 'pending' && task.assignedTo && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">Menunggu Konfirmasi Pekerja</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Pekerja telah ditugaskan. Menunggu konfirmasi dari pekerja untuk memulai pekerjaan sesuai jadwal yang ditentukan.
                      </p>
                    </div>
                  )}

                  {task.status === 'accepted' && task.assignedTo && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Siap Dimulai</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Pekerja telah menerima penugasan. Pekerjaan akan otomatis dimulai sesuai jadwal yang ditentukan: {formatDate(task.startDate || task.scheduledDate)} - {task.startTime || task.scheduledTime} WIB.
                      </p>
                    </div>
                  )}

                  {task.status === 'active' && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Pekerjaan Sedang Berlangsung</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Pekerja sedang mengerjakan tugas ini. Pekerjaan akan selesai sesuai estimasi waktu yang ditentukan.
                      </p>
                    </div>
                  )}

                  {/* Always show edit if task can be edited */}
                  {['draft', 'open', 'pending'].includes(task.status) && !task.assignedTo && (
                    <Link href={`/tugas/${taskId}/edit`}>
                      <Button variant="outline" className="flex items-center space-x-2">
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
      </main>
    </>
  );
}