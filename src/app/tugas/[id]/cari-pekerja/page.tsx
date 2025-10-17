'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkerRecommendation } from '@/components/features/tasks/WorkerRecommendation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskWorkerSearchPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        toast.error('Tugas tidak ditemukan');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Gagal memuat data tugas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerSelect = async (worker: any) => {
    try {
      // Assign worker to task
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: worker._id,
          status: 'open', // Tetap open, pekerja akan dapat penawaran
          searchMethod: 'find_worker'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`🤖 ${worker.name} berhasil ditugaskan!`);
        router.push('/riwayat?mode=employer');
      } else {
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error assigning worker:', error);
      toast.error('Terjadi kesalahan saat menugaskan pekerja');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Memuat data tugas...</p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">Tugas tidak ditemukan</p>
              <Button onClick={() => router.push('/dashboard')}>
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">🤖 Rekomendasi Pekerja AI</CardTitle>
                  <p className="text-gray-600">Untuk: {task.title}</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  ← Kembali
                </Button>
              </div>
            </CardHeader>
          </Card>

          <WorkerRecommendation
            jobData={{
              title: task.title,
              description: task.description,
              category: task.category,
              location: task.location,
              locationCoordinates: task.locationCoordinates
            }}
            onWorkerSelect={handleWorkerSelect}
          />
        </div>
      </main>
    </>
  );
}