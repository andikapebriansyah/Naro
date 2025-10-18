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
  const taskId = params?.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [selectedBank, setSelectedBank] = useState('bca');
  const [selectedEwallet, setSelectedEwallet] = useState('gopay');
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

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
      const costs = calculateCosts();
      
      // Validasi amount minimal
      if (costs.total < 10000) {
        toast.error('Jumlah pembayaran minimal Rp 10.000');
        setIsProcessing(false);
        return;
      }

      console.log('Creating invoice for task:', taskId);
      console.log('Payment amount:', costs.total);
      
      const payload = {
        taskId: taskId,
        amount: costs.total,
        payerEmail: session?.user?.email || 'customer@example.com',
        description: `Pembayaran untuk ${task.title}`,
        items: [
          {
            name: 'Upah Pekerja',
            quantity: 1,
            price: costs.workerWage,
            category: 'Worker Wage'
          },
          {
            name: 'Biaya Layanan (5%)',
            quantity: 1,
            price: costs.serviceFee,
            category: 'Service Fee'
          },
          {
            name: 'Biaya Admin',
            quantity: 1,
            price: costs.adminFee,
            category: 'Admin Fee'
          }
        ]
      };

      // Log payload untuk debug
      console.log('Invoice payload:', JSON.stringify(payload, null, 2));
      
      // Create Xendit invoice
      const response = await fetch('/api/xendit/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Invoice response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Gagal membuat invoice');
      }

      if (data.success && data.data) {
        // Save invoice info
        setInvoiceId(data.data.id);
        setInvoiceUrl(data.data.invoiceUrl);
        
        console.log('Updating task with invoice info...');
        
        // Update task with invoice info
        const updateResponse = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: selectedMethod,
            paymentStatus: 'pending',
            paymentAmount: costs.total,
            xenditInvoiceId: data.data.id,
            xenditExternalId: data.data.externalId
          }),
        });

        if (!updateResponse.ok) {
          console.warn('Failed to update task, but continuing with payment');
        }

        // Redirect to Xendit payment page
        console.log('Redirecting to:', data.data.invoiceUrl);
        toast.success('Membuka halaman pembayaran Xendit...');
        
        // Delay sedikit agar toast terlihat
        setTimeout(() => {
          window.location.href = data.data.invoiceUrl;
        }, 500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memproses pembayaran');
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
              <CardTitle>Metode Pembayaran Xendit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-900 text-sm mb-1">
                      Xendit Test Mode
                    </div>
                    <div className="text-blue-700 text-sm space-y-1">
                      <p>Anda akan diarahkan ke halaman pembayaran Xendit yang mendukung:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Kartu Kredit/Debit (Visa, Mastercard)</li>
                        <li>Transfer Bank (BCA, Mandiri, BNI, BRI, dll)</li>
                        <li>E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja)</li>
                        <li>Virtual Account</li>
                        <li>Retail Outlet (Alfamart, Indomaret)</li>
                      </ul>
                      <p className="mt-2 font-medium">
                        Mode test: Gunakan kredensial test dari dokumentasi Xendit
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Payment Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-yellow-900 text-sm mb-1">
                      Cara Test Pembayaran
                    </div>
                    <div className="text-yellow-800 text-sm space-y-1">
                      <p><strong>Kartu Test:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Nomor: 4000 0000 0000 0002</li>
                        <li>CVV: 123</li>
                        <li>Exp: 12/25</li>
                      </ul>
                      <p className="mt-2"><strong>Virtual Account:</strong> Akan generate nomor VA otomatis</p>
                      <p><strong>E-Wallet:</strong> Simulasi pembayaran di dashboard Xendit</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rincian Biaya</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Upah Pekerja</span>
                  <span className="font-semibold">{formatCurrency(costs.workerWage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Layanan (5%)</span>
                  <span className="font-semibold">{formatCurrency(costs.serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-semibold">{formatCurrency(costs.adminFee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(costs.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Pembayaran Aman dengan Xendit (Test Mode)
            </span>
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
                  Membuat Invoice...
                </>
              ) : (
                'Bayar Sekarang'
              )}
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}