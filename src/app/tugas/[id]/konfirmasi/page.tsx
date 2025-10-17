'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Info, Users, Clipboard, DollarSign, CheckCircle, Star, Lightbulb } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function TaskConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
      } else {
        toast.error('Gagal memuat data tugas');
      }
    } catch (error) {
      toast.error('Gagal memuat data tugas');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCosts = () => {
    const workerWage = task?.budget || 0;
    const serviceFee = Math.round(workerWage * 0.05);
    const adminFee = 2500;
    const total = workerWage + serviceFee + adminFee;

    return {
      workerWage,
      serviceFee,
      adminFee,
      total
    };
  };

  const handleProceedToPayment = async () => {
    if (!agreedToTerms) {
      toast.error('Silakan setujui ketentuan layanan terlebih dahulu');
      return;
    }

    // Langsung ke halaman pembayaran tanpa mengubah status tugas
    // Status akan diubah setelah pembayaran berhasil
    router.push(`/tugas/${taskId}/pembayaran`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
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

  const costs = calculateCosts();

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
                onClick={() => router.push(`/tugas/${taskId}/perjanjian`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Konfirmasi Pemesanan</h1>
                <p className="text-sm text-gray-600">Periksa kembali detail pesanan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
          {/* Alert Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900 text-sm">Pembayaran Aman</div>
              <div className="text-blue-700 text-sm">
                Dana akan ditahan dan dibayarkan ke pekerja setelah tugas selesai
              </div>
            </div>
          </div>

          {/* Worker Section */}
          {task.assignedTo && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pekerja Terpilih
                </CardTitle>
                <Button variant="outline" size="sm">
                  Ubah
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-14 w-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(task.assignedTo.name || 'Pekerja')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{task.assignedTo.name}</h3>
                      {task.assignedTo.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {task.assignedTo.workCategories?.map((cat: string) => 
                        cat.charAt(0).toUpperCase() + cat.slice(1)
                      ).join(', ') || 'Pekerja Profesional'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{task.assignedTo.rating || 5.0}</span>
                        <span>({task.assignedTo.completedTasks || 0})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{task.assignedTo.completedTasks || 0} tugas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Details */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Detail Tugas
              </CardTitle>
              <Button variant="outline" size="sm">
                Ubah
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Jenis Pekerjaan</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-60">{task.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Kategori</span>
                  <span className="text-sm font-medium text-gray-900">
                    {task.category?.charAt(0).toUpperCase() + task.category?.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Lokasi</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-60">{task.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Jadwal</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-60">
                    {formatDate(task.scheduledDate)}<br />
                    {task.scheduledTime} WIB
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Durasi</span>
                  <span className="text-sm font-medium text-gray-900">
                    {task.estimatedDuration || 'Sesuai kebutuhan'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600">Deskripsi</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-60">
                    {task.description}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rincian Biaya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Upah Pekerja</span>
                    <span className="text-sm font-medium">{formatCurrency(costs.workerWage)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Biaya Layanan (5%)</span>
                    <span className="text-sm font-medium">{formatCurrency(costs.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Biaya Admin</span>
                    <span className="text-sm font-medium">{formatCurrency(costs.adminFee)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Pembayaran</span>
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(costs.total)}</span>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    Dana akan ditahan oleh sistem dan dibayarkan ke pekerja dalam 24 jam setelah Anda konfirmasi tugas selesai
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                  Saya telah membaca dan <span className="font-semibold text-gray-900">menyetujui ketentuan layanan</span> KawanKerja serta bersedia membayar upah yang telah disepakati
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <Button
              onClick={handleProceedToPayment}
              disabled={!agreedToTerms}
              className="w-full h-12 text-base font-semibold"
            >
              Lanjut ke Pembayaran →
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}