'use client';

import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pembayaran Gagal
          </h1>
          <p className="text-gray-600 mb-6">
            Pembayaran Anda tidak dapat diproses. Silakan coba lagi.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/tugas/${taskId}/pembayaran`)}
              className="w-full"
            >
              Coba Lagi
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
