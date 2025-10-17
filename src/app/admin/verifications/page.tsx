'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface KTPVerification {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  ktpVerification: {
    status: 'pending' | 'approved' | 'rejected';
    ktpImage: string;
    selfieImage: string;
    ktpNumber: string;
    fullName: string;
    dateOfBirth: string;
    address: string;
    submittedAt: string;
    verifiedAt?: string;
    rejectionReason?: string;
  };
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [verifications, setVerifications] = useState<KTPVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<KTPVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<KTPVerification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rejection reason
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Akses ditolak - Hanya admin yang bisa mengakses halaman ini');
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch verifications
  useEffect(() => {
    fetchVerifications();
  }, []);

  // Filter verifications
  useEffect(() => {
    let filtered = verifications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.ktpVerification.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query) ||
        v.ktpVerification?.fullName?.toLowerCase().includes(query) ||
        v.ktpVerification?.ktpNumber?.includes(query)
      );
    }

    setFilteredVerifications(filtered);
  }, [verifications, statusFilter, searchQuery]);

  const fetchVerifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/verifications?status=all');
      const data = await response.json();

      if (data.success) {
        setVerifications(data.data);
      } else {
        toast.error('Gagal memuat data verifikasi');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/verifications/${verificationId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verifikasi berhasil disetujui');
        fetchVerifications();
        setSelectedVerification(null);
      } else {
        toast.error(data.error || 'Gagal menyetujui verifikasi');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Verifikasi ditolak');
        fetchVerifications();
        setSelectedVerification(null);
        setShowRejectForm(false);
        setRejectionReason('');
      } else {
        toast.error(data.error || 'Gagal menolak verifikasi');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Menunggu
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  // Detail View
  if (selectedVerification) {
    const verification = selectedVerification;
    const ktp = verification.ktpVerification;

    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVerification(null);
                setShowRejectForm(false);
                setRejectionReason('');
              }}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Informasi Pengguna</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-600">Nama Lengkap</Label>
                    <p className="text-lg font-medium">{verification.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Label>
                    <p className="text-sm">{verification.email}</p>
                  </div>
                  {verification.phone && (
                    <div>
                      <Label className="text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        Telepon
                      </Label>
                      <p className="text-sm">{verification.phone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Tanggal Pengajuan
                    </Label>
                    <p className="text-sm">{formatDate(ktp.submittedAt)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(ktp.status)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* KTP Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Data KTP</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-600">Nomor KTP</Label>
                    <p className="text-lg font-mono font-medium">{ktp.ktpNumber}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Nama Lengkap (KTP)</Label>
                    <p className="font-medium">{ktp.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Tanggal Lahir</Label>
                    <p className="text-sm">{ktp.dateOfBirth}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Alamat
                    </Label>
                    <p className="text-sm">{ktp.address}</p>
                  </div>
                  {ktp.status === 'rejected' && ktp.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <Label className="text-red-800 font-semibold flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Alasan Penolakan
                      </Label>
                      <p className="text-sm text-red-700 mt-1">{ktp.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* KTP Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Foto KTP</span>
                  </CardTitle>
                  <CardDescription>Pastikan foto jelas dan data terbaca</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={ktp.ktpImage}
                      alt="KTP"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <a
                    href={ktp.ktpImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                  >
                    Buka gambar full size →
                  </a>
                </CardContent>
              </Card>

              {/* Selfie Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Foto Selfie dengan KTP</span>
                  </CardTitle>
                  <CardDescription>Verifikasi kesesuaian wajah</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={ktp.selfieImage}
                      alt="Selfie with KTP"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <a
                    href={ktp.selfieImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                  >
                    Buka gambar full size →
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            {ktp.status === 'pending' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Tindakan Verifikasi</CardTitle>
                  <CardDescription>
                    Pastikan semua data sudah sesuai sebelum menyetujui atau menolak
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showRejectForm ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => handleApprove(verification._id)}
                        disabled={isProcessing}
                        className="flex-1"
                        size="lg"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-5 h-5 mr-2" />
                        )}
                        Setujui Verifikasi
                      </Button>
                      <Button
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessing}
                        className="flex-1"
                        size="lg"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Tolak Verifikasi
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejectionReason">
                          Alasan Penolakan <span className="text-red-600">*</span>
                        </Label>
                        <textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Jelaskan alasan penolakan verifikasi ini..."
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Alasan ini akan dikirimkan kepada pengguna
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleReject(verification._id)}
                          disabled={isProcessing || !rejectionReason.trim()}
                          className="flex-1"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-5 h-5 mr-2" />
                          )}
                          Konfirmasi Penolakan
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          variant="outline"
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verification Guideline */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Panduan Verifikasi KTP
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>✓ Pastikan foto KTP jelas dan tidak buram</li>
                      <li>✓ Verifikasi nomor KTP (16 digit) sesuai dengan foto</li>
                      <li>✓ Nama lengkap pada KTP harus sesuai dengan foto</li>
                      <li>✓ Wajah pada selfie harus jelas dan sesuai dengan KTP</li>
                      <li>✓ KTP pada foto selfie harus terbaca dengan jelas</li>
                      <li>✓ Periksa tanggal lahir dan alamat sudah benar</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  // List View
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Verifikasi KTP
                </h1>
                <p className="text-gray-600">
                  Kelola verifikasi identitas pengguna
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search" className="flex items-center mb-2">
                    <Search className="w-4 h-4 mr-1" />
                    Cari
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Cari nama, email, atau nomor KTP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <Label htmlFor="status" className="flex items-center mb-2">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter Status
                  </Label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {verifications.filter(v => v.ktpVerification.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600">Menunggu</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {verifications.filter(v => v.ktpVerification.status === 'approved').length}
                  </p>
                  <p className="text-sm text-gray-600">Disetujui</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {verifications.filter(v => v.ktpVerification.status === 'rejected').length}
                  </p>
                  <p className="text-sm text-gray-600">Ditolak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verifications List */}
          {filteredVerifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada verifikasi
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Tidak ada verifikasi yang sesuai dengan filter'
                    : 'Belum ada pengajuan verifikasi KTP'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredVerifications.map((verification) => {
                const ktp = verification.ktpVerification;
                return (
                  <Card key={verification._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {verification.name}
                              </h3>
                              <p className="text-sm text-gray-600">{verification.email}</p>
                            </div>
                            {getStatusBadge(ktp.status)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">NIK:</span>
                              <span className="ml-2 font-mono font-medium">{ktp.ktpNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Nama KTP:</span>
                              <span className="ml-2 font-medium">{ktp.fullName}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Diajukan:</span>
                              <span className="ml-2">{formatDate(ktp.submittedAt)}</span>
                            </div>
                            {ktp.verifiedAt && (
                              <div>
                                <span className="text-gray-600">Diverifikasi:</span>
                                <span className="ml-2">{formatDate(ktp.verifiedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => setSelectedVerification(verification)}
                            variant="outline"
                            size="lg"
                          >
                            <Eye className="w-5 h-5 mr-2" />
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}