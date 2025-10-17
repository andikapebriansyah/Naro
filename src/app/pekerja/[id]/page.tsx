'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Loader2, Calendar, DollarSign } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workerId = params.id as string;

  const [worker, setWorker] = useState<any>(null);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkerDetail();
  }, [workerId]);

  const fetchWorkerDetail = async () => {
    setIsLoading(true);
    try {
      // Fetch worker profile
      const workerResponse = await fetch(`/api/users/${workerId}`);
      const workerData = await workerResponse.json();

      if (workerData.success) {
        setWorker(workerData.data);

        // Fetch work history
        try {
          const historyResponse = await fetch(`/api/users/${workerId}/work-history`);
          const historyData = await historyResponse.json();
          if (historyData.success) {
            setWorkHistory(historyData.data);
          }
        } catch (error) {
          console.error('Error fetching work history:', error);
          setWorkHistory([]); // Set empty array if fetch fails
        }

        // Fetch reviews
        try {
          const reviewsResponse = await fetch(`/api/users/${workerId}/reviews`);
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success) {
            setReviews(reviewsData.data);
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
          setReviews([]); // Set empty array if fetch fails
        }
      }
    } catch (error) {
      console.error('Error fetching worker detail:', error);
      toast.error('Gagal memuat detail pekerja');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !worker) {
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
      <main className="min-h-screen bg-gray-50 pb-20">
        {/* Header Navigation */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Kembali
            </button>
            <button className="text-gray-600 hover:text-gray-900">
              ⋯
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Profile Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-white text-2xl font-medium flex-shrink-0">
                  {getInitials(worker.name)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold">{worker.name}</h1>
                    {worker.isVerified && (
                      <span className="text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    {worker.workCategories && worker.workCategories.length > 0 
                      ? worker.workCategories.map((cat: string) => {
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
                        }).join(', ')
                      : 'Pekerja Umum'
                    }
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {worker.rating || 0}
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{worker.completedTasks || 0}</div>
                  <div className="text-sm text-gray-600">Tugas Selesai</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{reviews.length || 0}</div>
                  <div className="text-sm text-gray-600">Ulasan</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <span>👤</span>
                <span>Tentang</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {worker.about || 
                  'Berpengalaman sebagai pekerja lebih dari 5 tahun. Terbiasa mengerjakan berbagai pekerjaan. Pekerja keras, dapat diandalkan, dan selalu menyelesaikan tugas dengan baik.'}
              </p>
            </CardContent>
          </Card>

          {/* Work History */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <span>💼</span>
                <span>Riwayat Pekerjaan</span>
              </h2>

              <div className="space-y-4">
                {workHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada riwayat pekerjaan
                  </p>
                ) : (
                  workHistory.map((work) => (
                    <div key={work.id} className="border-l-2 border-primary-500 pl-4 pb-4">
                      <div className="text-xs text-gray-500 uppercase mb-1">
                        {work.date}
                      </div>
                      <h4 className="font-semibold mb-1">{work.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{work.employer}</p>
                      <p className="text-sm text-gray-700 mb-2">{work.description}</p>
                      <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span>Upah: Rp {work.payment.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <span>⭐</span>
                <span>Ulasan ({reviews.length})</span>
              </h2>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada ulasan
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium flex-shrink-0">
                          {getInitials(review.reviewer)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{review.reviewer}</h4>
                            <div className="flex items-center">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 text-yellow-500 fill-current"
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{review.date}</p>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-700">
                <MapPin className="h-5 w-5" />
                <span>Jarak dari lokasi Anda:</span>
                <strong>2.1 km</strong>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </>
  );
}