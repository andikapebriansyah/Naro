'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const MINIMUM_WITHDRAWAL = 10000;

interface WithdrawalMethodData {
  type: 'bank' | 'ewallet';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  ewalletType?: string;
  ewalletNumber?: string;
}

interface WithdrawalHistory {
  _id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  method: WithdrawalMethodData;
}

export default function PenarikanPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethodData | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
    if (session?.user) {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    try {
      // Load balance
      const profileRes = await fetch('/api/users/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setBalance(profileData.data.balance || 0);
      }

      // Load withdrawal method
      const methodRes = await fetch('/api/users/withdrawal-method');
      if (methodRes.ok) {
        const methodData = await methodRes.json();
        setWithdrawalMethod(methodData.data);
      }

      // Load withdrawal history
      const historyRes = await fetch('/api/users/withdrawal');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setWithdrawalHistory(historyData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalMethod) {
      toast.error('Atur metode penarikan terlebih dahulu');
      router.push('/profil');
      return;
    }

    const withdrawAmount = parseInt(amount);

    if (!withdrawAmount || withdrawAmount < MINIMUM_WITHDRAWAL) {
      toast.error(`Minimal penarikan Rp ${MINIMUM_WITHDRAWAL.toLocaleString('id-ID')}`);
      return;
    }

    if (withdrawAmount > balance) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Penarikan berhasil diproses!');
        setAmount('');
        await loadData(); // Reload data
      } else {
        toast.error(result.error || 'Gagal memproses penarikan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Selesai</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Diproses</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Gagal</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const setQuickAmount = (percent: number) => {
    const quickAmount = Math.floor((balance * percent) / 100);
    setAmount(quickAmount.toString());
  };

  if (status === 'loading' || isLoadingData) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20">
        {/* Header Section */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profil')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Penarikan Saldo</h1>
                <p className="text-sm text-gray-600">Tarik saldo ke rekening Anda</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Balance Card */}
          <Card className="mb-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-90">Saldo Tersedia</div>
                <Wallet className="h-6 w-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{formatCurrency(balance)}</div>
              <div className="text-xs opacity-75">
                Minimal penarikan: {formatCurrency(MINIMUM_WITHDRAWAL)}
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Method Info */}
          {withdrawalMethod ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Metode Penarikan</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/profil')}
                  >
                    Ubah
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
                    {withdrawalMethod.type === 'bank' ? '🏦' : '📱'}
                  </div>
                  <div className="flex-1">
                    {withdrawalMethod.type === 'bank' ? (
                      <>
                        <div className="font-semibold">{withdrawalMethod.bankName?.toUpperCase()}</div>
                        <div className="text-sm text-gray-600">{withdrawalMethod.accountNumber}</div>
                        <div className="text-sm text-gray-600">{withdrawalMethod.accountName}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold capitalize">{withdrawalMethod.ewalletType}</div>
                        <div className="text-sm text-gray-600">{withdrawalMethod.ewalletNumber}</div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900">Metode Penarikan Belum Diatur</div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Atur metode penarikan terlebih dahulu di halaman profil
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => router.push('/profil')}
                    >
                      Atur Sekarang
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdrawal Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Jumlah Penarikan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimal ${MINIMUM_WITHDRAWAL.toLocaleString('id-ID')}`}
                  className="mt-1 text-lg"
                  min={MINIMUM_WITHDRAWAL}
                  max={balance}
                  disabled={!withdrawalMethod}
                />
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label className="text-sm text-gray-600">Pilih Cepat</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickAmount(25)}
                    disabled={!withdrawalMethod || balance < MINIMUM_WITHDRAWAL}
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickAmount(50)}
                    disabled={!withdrawalMethod || balance < MINIMUM_WITHDRAWAL}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickAmount(75)}
                    disabled={!withdrawalMethod || balance < MINIMUM_WITHDRAWAL}
                  >
                    75%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(balance.toString())}
                    disabled={!withdrawalMethod || balance < MINIMUM_WITHDRAWAL}
                  >
                    100%
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>Mode Demo:</strong> Penarikan akan diproses otomatis. Dalam mode produksi, penarikan akan ditinjau oleh admin terlebih dahulu.
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={isLoading || !withdrawalMethod || !amount || parseInt(amount) < MINIMUM_WITHDRAWAL || parseInt(amount) > balance}
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Tarik Saldo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penarikan</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalHistory.length > 0 ? (
                <div className="space-y-3">
                  {withdrawalHistory.map((withdrawal) => (
                    <div
                      key={withdrawal._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          withdrawal.status === 'completed' ? 'bg-green-100' :
                          withdrawal.status === 'processing' ? 'bg-blue-100' :
                          withdrawal.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {withdrawal.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                           withdrawal.status === 'processing' ? <Clock className="h-5 w-5 text-blue-600" /> :
                           withdrawal.status === 'failed' ? <XCircle className="h-5 w-5 text-red-600" /> :
                           <Clock className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(withdrawal.amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {withdrawal.method.type === 'bank'
                              ? `${withdrawal.method.bankName?.toUpperCase()} - ${withdrawal.method.accountNumber}`
                              : `${withdrawal.method.ewalletType} - ${withdrawal.method.ewalletNumber}`
                            }
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(withdrawal.createdAt)}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(withdrawal.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Belum ada riwayat penarikan</p>
                  <p className="text-sm mt-1">Penarikan Anda akan muncul di sini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </>
  );
}