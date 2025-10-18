'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  useEffect(() => {
    // Update task status to 'open'
    const updateTaskStatus = async () => {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'open',
            paymentStatus: 'completed',
            paymentDate: new Date()
          }),
        });
        toast.success('Pembayaran berhasil! Tugas telah dipublikasikan.');
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    };

    updateTaskStatus();
  }, [taskId]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pembayaran Berhasil!
          </h1>
          <p className="text-gray-600 mb-6">
            Tugas Anda telah dipublikasikan dan menunggu pekerja mengambilnya.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Kembali ke Dashboard
            </Button>
            <Button
              onClick={() => router.push(`/tugas/${taskId}`)}
              variant="outline"
              className="w-full"
            >
              Lihat Detail Tugas
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
