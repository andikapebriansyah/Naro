'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CreditCard, Building2, Smartphone, Shield, CheckCircle, Info } from 'lucide-react';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [selectedBank, setSelectedBank] = useState('bca');
  const [selectedEwallet, setSelectedEwallet] = useState('gopay');

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
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Gagal memuat data tugas');
      router.push('/dashboard');
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

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Langsung update status tugas ke 'open' tanpa proses pembayaran kompleks
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'open',
          paymentMethod: selectedMethod,
          paymentStatus: 'completed',
          paymentAmount: calculateCosts().total,
          paymentDate: new Date()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tugas berhasil dipublikasikan!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Gagal mempublikasikan tugas');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mempublikasikan tugas');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const banks = [
    { id: 'bca', name: 'BCA', icon: '🏦' },
    { id: 'mandiri', name: 'Mandiri', icon: '🏦' },
    { id: 'bni', name: 'BNI', icon: '🏦' },
    { id: 'bri', name: 'BRI', icon: '🏦' },
    { id: 'cimb', name: 'CIMB', icon: '🏦' },
    { id: 'permata', name: 'Permata', icon: '🏦' },
  ];

  const ewallets = [
    { id: 'gopay', name: 'GoPay', icon: '📱' },
    { id: 'ovo', name: 'OVO', icon: '📱' },
    { id: 'dana', name: 'DANA', icon: '📱' },
    { id: 'shopeepay', name: 'ShopeePay', icon: '📱' },
  ];

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
                onClick={() => router.push(`/tugas/${taskId}/konfirmasi`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Publikasi Tugas</h1>
                <p className="text-sm text-gray-600">Review final dan publikasikan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl pb-32">
          {/* Task Summary */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 mb-6 text-white">
            <div className="text-sm opacity-90 mb-2">Siap Dipublikasikan</div>
            <div className="text-3xl font-bold mb-3">{formatCurrency(costs.total)}</div>
            <div className="text-sm opacity-90">{task.title}</div>
            <div className="text-sm opacity-90">
              {formatDate(task.scheduledDate)} • {task.scheduledTime} WIB
            </div>
            <div className="text-sm opacity-90 mt-2">
              📍 {task.location}
            </div>
          </div>

          {/* Payment Methods */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Card Payment */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedMethod('card')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === 'card' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'card' && (
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Kartu Kredit/Debit</div>
                      <div className="text-sm text-gray-600">Visa, Mastercard</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    Populer
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'bank' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedMethod('bank')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === 'bank' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'bank' && (
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Transfer Bank</div>
                      <div className="text-sm text-gray-600">BCA, Mandiri, BNI, BRI</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* E-Wallet */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'ewallet' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedMethod('ewallet')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === 'ewallet' ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'ewallet' && (
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold">E-Wallet</div>
                      <div className="text-sm text-gray-600">GoPay, OVO, DANA, ShopeePay</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details - Card */}
          {selectedMethod === 'card' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detail Kartu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-900 text-sm">Mode Demo</div>
                    <div className="text-blue-700 text-sm">
                      Tidak perlu mengisi detail kartu. Klik "Bayar Sekarang" untuk langsung mempublikasikan tugas.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details - Bank */}
          {selectedMethod === 'bank' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pilih Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {banks.map((bank) => (
                    <div
                      key={bank.id}
                      className={`p-3 text-center border-2 rounded-lg cursor-pointer transition-all ${
                        selectedBank === bank.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <div className="text-2xl mb-2">{bank.icon}</div>
                      <div className="text-sm font-semibold text-gray-700">{bank.name}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    Mode demo: Klik "Bayar Sekarang" untuk langsung mempublikasikan tugas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details - E-Wallet */}
          {selectedMethod === 'ewallet' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pilih E-Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ewallets.map((ewallet) => (
                    <div
                      key={ewallet.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                        selectedEwallet === ewallet.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => setSelectedEwallet(ewallet.id)}
                    >
                      <div className="text-2xl">{ewallet.icon}</div>
                      <div className="text-sm font-semibold text-gray-700">{ewallet.name}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    Mode demo: Klik "Bayar Sekarang" untuk langsung mempublikasikan tugas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-lg mb-6">
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">Mode Demo - Tidak ada pembayaran yang sebenarnya diproses</span>
          </div>
        </div>

        {/* Fixed Bottom Payment Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">Total Bayar</div>
              <div className="text-xl font-bold text-primary-600">{formatCurrency(costs.total)}</div>
            </div>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mempublikasikan Tugas...
                </>
              ) : (
                'Publikasikan Tugas'
              )}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}