'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MapPin, Calendar, Clock, DollarSign, User, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { canAccessFeatures, missingFields } = useProfileValidation();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get referrer from query params
  const from = searchParams.get('from') || 'pekerjaan';

  const handleBack = () => {
    if (from === 'dashboard') {
      router.push('/dashboard');
    } else {
      router.push('/pekerjaan');
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      const response = await fetch(`/api/tasks/${jobId}`);
      const data = await response.json();
      if (data.success) {
        setJob(data.data);
      } else {
        toast.error('Pekerjaan tidak ditemukan');
        router.push('/pekerjaan');
      }
    } catch (error) {
      toast.error('Gagal memuat detail pekerjaan');
      router.push('/pekerjaan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!session) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/auth/login');
      return;
    }

    if (!canAccessFeatures) {
      toast.error('Lengkapi verifikasi dan profil untuk melamar pekerjaan');
      router.push('/profil');
      return;
    }

    if (!applicationMessage.trim()) {
      toast.error('Silakan tulis pesan lamaran');
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch(`/api/tasks/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: applicationMessage
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lamaran berhasil dikirim!');
        fetchJobDetail();
        setApplicationMessage('');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(data.error || 'Gagal mengirim lamaran');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengirim lamaran');
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!session) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!canAccessFeatures) {
      toast.error('Lengkapi verifikasi dan profil untuk menerima pekerjaan');
      router.push('/profil');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tasks/${jobId}/accept-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pekerjaan berhasil diterima!');
        fetchJobDetail();
      } else {
        toast.error(data.error || 'Gagal menerima pekerjaan');
      }
    } catch (error) {
      console.error('Error accepting offered job:', error);
      toast.error('Terjadi kesalahan saat menerima pekerjaan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!session) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!canAccessFeatures) {
      toast.error('Lengkapi verifikasi dan profil untuk menolak pekerjaan');
      router.push('/profil');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menolak penawaran pekerjaan ini?')) {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/tasks/${jobId}/reject-offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Penawaran berhasil ditolak');
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Gagal menolak penawaran');
        }
      } catch (error) {
        console.error('Error rejecting offered job:', error);
        toast.error('Terjadi kesalahan saat menolak penawaran');
      } finally {
        setIsProcessing(false);
      }
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

  const isOwnJob = session?.user?.id === job?.posterId?._id;
  const hasApplied = job?.applicants?.some((app: any) => app.userId === session?.user?.id);
  const isOfferedJob = job?.searchMethod === 'find_worker';
  const isAssignedToCurrentUser = job?.assignedTo === session?.user?.id;

  if (isLoading || !job) {
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
                onClick={() => router.push('/pekerjaan')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Detail Pekerjaan</h1>
                <p className="text-sm text-gray-600">Informasi lengkap pekerjaan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
          {/* Profile Incomplete Warning - Show at top of page */}
          {!isOwnJob && !canAccessFeatures && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-yellow-800 mb-1">
                      Profil Belum Lengkap
                    </div>
                    <div className="text-xs text-yellow-700 mb-3">
                      Anda perlu melengkapi verifikasi dan profil untuk melamar pekerjaan.
                      <br />
                      <strong>Yang perlu dilengkapi:</strong> {missingFields.join(', ')}
                    </div>
                    <div className="flex gap-2">
                      {!session?.user?.isVerified && (
                        <Link href="/verifikasi">
                          <Button size="sm" className="text-xs">
                            Verifikasi KTP
                          </Button>
                        </Link>
                      )}
                      <Link href="/profil">
                        <Button size="sm" variant="outline" className="text-xs border-yellow-600 text-yellow-700">
                          Lengkapi Profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex gap-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                      {getCategoryLabel(job.category)}
                    </span>
                    {isOfferedJob && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        🎯 Ditawari Khusus
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatCurrency(job.budget)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.pricingType === 'fixed' ? 'Total' : 'Per jam'}
                  </div>
                </div>
              </div>

              {/* Job Meta */}
              <div className="space-y-3">
                {/* Location */}
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{job.location}</span>
                </div>

                {/* Complete Schedule Info */}
                {job.startDate && job.endDate ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Jadwal Pekerjaan
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tanggal Mulai</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(job.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-primary-600 font-medium mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.startTime || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tanggal Selesai</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(job.endDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-primary-600 font-medium mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.endTime || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : job.scheduledDate ? (
                  // Fallback to old format if new fields not available
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-700">
                          {new Date(job.scheduledDate).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        {job.scheduledTime && (
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {job.scheduledTime} WIB
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-600">
                    Jadwal akan ditentukan bersama
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Deskripsi Pekerjaan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              {job.estimatedDuration && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Estimasi Durasi:</span>
                    <span className="text-sm text-blue-700">{job.estimatedDuration}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Poster Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pemberi Kerja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(job.posterId?.name || 'Pengguna')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg">{job.posterId?.name}</h3>
                    {job.posterId?.isVerified && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  {job.posterId?.rating && (
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{job.posterId.rating}</span>
                      <span className="text-gray-600 text-sm">(rating)</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Bergabung {new Date(job.createdAt).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicants - Only show for publication jobs */}
          {!isOfferedJob && job.applicants && job.applicants.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pelamar ({job.applicants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.applicants.slice(0, 3).map((applicant: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {getInitials(applicant.user?.name || 'Pelamar')}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{applicant.user?.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(applicant.appliedAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${applicant.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          applicant.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                        {applicant.status === 'accepted' ? 'Diterima' :
                          applicant.status === 'rejected' ? 'Ditolak' : 'Pending'}
                      </div>
                    </div>
                  ))}
                  {job.applicants.length > 3 && (
                    <div className="text-center text-sm text-gray-600">
                      dan {job.applicants.length - 3} pelamar lainnya
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Form - For Publication Jobs */}
          {!isOwnJob && job.status === 'open' && !isOfferedJob && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {hasApplied ? 'Anda sudah melamar pekerjaan ini' : 'Lamar Pekerjaan'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <p className="text-gray-600">Lamaran Anda sudah dikirim. Tunggu konfirmasi dari pemberi kerja.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesan Lamaran
                      </label>
                      <textarea
                        className="w-full min-h-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Ceritakan mengapa Anda cocok untuk pekerjaan ini, pengalaman relevan, dan kapan Anda bisa mulai..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        disabled={!canAccessFeatures}
                      />
                    </div>

                    {!canAccessFeatures && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-700">
                          <strong>Profil belum lengkap.</strong> Lengkapi verifikasi dan profil untuk melamar pekerjaan.
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleApply}
                      disabled={isApplying || !applicationMessage.trim() || !canAccessFeatures}
                      className="w-full"
                      title={!canAccessFeatures ? 'Lengkapi verifikasi dan profil untuk melamar' : ''}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengirim Lamaran...
                        </>
                      ) : !canAccessFeatures ? (
                        <>
                          🔒 Lengkapi Profil untuk Melamar
                        </>
                      ) : (
                        'Kirim Lamaran'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agreement Section for Offered Jobs - Simple Preview + Download */}
          {!isOwnJob && isOfferedJob && job.status === 'open' && (
            <>
              <Card className="mb-6 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Pekerjaan Ditawari Khusus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Anda telah dipilih untuk pekerjaan ini!
                    </h3>
                    <p className="text-green-700 mb-4">
                      Pemberi kerja telah menawarkan pekerjaan ini langsung kepada Anda.
                      Silakan tinjau surat perjanjian di bawah ini.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Simple Agreement Preview */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Surat Perjanjian Kerja</CardTitle>
                  <p className="text-gray-600">Preview dokumen perjanjian</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Agreement Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="bg-white rounded p-6 text-sm space-y-3 border">
                      <div className="text-center">
                        <h4 className="font-bold text-lg">SURAT PERJANJIAN KERJA</h4>
                        <p className="text-gray-600">Nomor: NARO/2025/{job._id.slice(-6)}</p>
                      </div>

                      <div className="border-t pt-3">
                        <p className="mb-2">
                          Perjanjian ini dibuat pada tanggal{' '}
                          {new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="font-semibold text-gray-800">Pemberi Kerja:</p>
                          <p>{job.posterId?.name || '[Nama Pemberi Kerja]'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Pekerja:</p>
                          <p>{session?.user?.name || '[Nama Anda]'}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <h5 className="font-semibold mb-2">Detail Pekerjaan:</h5>
                        <div className="space-y-1">
                          <p><span className="font-medium">Judul:</span> {job.title}</p>
                          <p><span className="font-medium">Kategori:</span> {getCategoryLabel(job.category)}</p>
                          <p><span className="font-medium">Lokasi:</span> {job.location}</p>
                          <p><span className="font-medium">Jadwal:</span> {formatDate(job.scheduledDate)} - {job.scheduledTime}</p>
                          <p><span className="font-medium">Nilai Kontrak:</span> {formatCurrency(job.budget)}</p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <p className="text-gray-600 text-xs">
                          * Dokumen lengkap dengan ketentuan dan klausul dapat diunduh menggunakan tombol di bawah
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Download and Action Buttons */}
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        window.open(`/api/tasks/${job._id}/agreement/download`, '_blank');
                      }}
                    >
                      📄 Unduh Surat Perjanjian Lengkap (PDF)
                    </Button>

                    {!canAccessFeatures && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-700">
                          <strong>Profil belum lengkap.</strong> Lengkapi verifikasi dan profil untuk menerima/menolak pekerjaan.
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleRejectOffer}
                        disabled={isProcessing || !canAccessFeatures}
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canAccessFeatures ? 'Lengkapi profil untuk menolak pekerjaan' : ''}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          'Tolak'
                        )}
                      </Button>
                      <Button
                        onClick={handleAcceptOffer}
                        disabled={isProcessing || !canAccessFeatures}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canAccessFeatures ? 'Lengkapi profil untuk menerima pekerjaan' : ''}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          'Terima'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Agreement Section for Accepted Offered Jobs */}
          {!isOwnJob && isOfferedJob && (job.status === 'accepted' || job.status === 'active') && isAssignedToCurrentUser && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Pekerjaan Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Anda telah menerima pekerjaan ini
                  </h3>
                  <p className="text-blue-700 mb-6">
                    Status: {job.status === 'accepted' ? 'Accepted - Menunggu Mulai Kerja' : 'Active - Sedang Dikerjakan'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      className="border-blue-600 text-blue-600 hover:bg-blue-100"
                    >
                      Kembali ke Dashboard
                    </Button>
                    <Button
                      onClick={() => router.push(`/tugas/${jobId}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Kelola Pekerjaan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isOwnJob && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="text-center text-blue-800">
                  <User className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">Ini adalah pekerjaan yang Anda posting</p>
                  <p className="text-sm">Anda tidak dapat melamar pekerjaan sendiri</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}