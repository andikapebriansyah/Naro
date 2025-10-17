'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layouts/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Loader2, X, Phone, User, Briefcase, Clock } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

export default function TaskWorkerSearchPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [showWorkerDetail, setShowWorkerDetail] = useState(false);
  const [selectedWorkerData, setSelectedWorkerData] = useState<any>(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (task) {
      fetchWorkers();
    }
  }, [task, session]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data tugas');
    }
  };

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (task?.category) params.append('category', task.category);

      console.log('Fetching workers with params:', params.toString());
      const response = await fetch(`/api/workers?${params}`);
      const data = await response.json();

      console.log('Workers API response:', data);

      if (data.success) {
        // FILTER: Exclude current user from worker list
        const filteredWorkers = data.data.filter((worker: any) => 
          worker._id.toString() !== session?.user?.id
        );
        console.log('Filtered workers:', filteredWorkers);
        setWorkers(filteredWorkers);
      } else {
        console.error('Workers API failed:', data.error);
        toast.error('Gagal memuat daftar pekerja');
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Gagal memuat daftar pekerja');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedWorkers = [...filteredWorkers].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'tasks') {
      return (b.completedTasks || 0) - (a.completedTasks || 0);
    }
    return 0;
  });

  const handleSelectWorker = (workerId: string) => {
    setSelectedWorker(workerId);
  };

  const handleViewWorkerDetail = (worker: any) => {
    setSelectedWorkerData(worker);
    setShowWorkerDetail(true);
  };

  const handleCloseWorkerDetail = () => {
    setShowWorkerDetail(false);
    setSelectedWorkerData(null);
  };

  const handleSelectFromDetail = () => {
    if (selectedWorkerData) {
      setSelectedWorker(selectedWorkerData._id);
      setShowWorkerDetail(false);
      toast.success(`${selectedWorkerData.name} dipilih sebagai pekerja`);
    }
  };

  const handleContinue = async () => {
    if (!selectedWorker) {
      toast.error('Pilih pekerja terlebih dahulu');
      return;
    }

    try {
      // Assign worker to task and change status to 'pending' (waiting for worker acceptance)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: selectedWorker,
          status: 'pending' // Status indicates worker is assigned but hasn't accepted yet
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Pekerja berhasil ditugaskan!');
        // Untuk metode find_worker, langsung ke dashboard/riwayat karena perjanjian sudah diatur sebelumnya
        // Tidak perlu ke halaman perjanjian lagi
        router.push('/riwayat?mode=employer');
      } else {
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error assigning worker:', error);
      toast.error('Terjadi kesalahan saat menugaskan pekerja');
    }
  };

  if (!task) {
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
      <main className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="mb-4">
              <button
                onClick={() => router.push(`/tugas/buat?edit=${taskId}`)}
                className="text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Kembali ke Edit Tugas
              </button>
              <h1 className="text-2xl font-bold">Cari Pekerja</h1>
              <p className="text-gray-600">Untuk: {task.title}</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Cari nama pekerja..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Chips */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSortBy('')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  sortBy === ''
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  sortBy === 'rating'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Rating Tertinggi
              </button>
              <button
                onClick={() => setSortBy('tasks')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  sortBy === 'tasks'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Paling Berpengalaman
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Ditemukan <strong>{sortedWorkers.length} pekerja</strong>
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 border-b-2 border-primary-600 mx-auto animate-spin" />
              <p className="mt-4 text-gray-600">Memuat pekerja...</p>
            </div>
          ) : sortedWorkers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Tidak ada pekerja ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 pb-24">
              {sortedWorkers.map((worker) => (
                <Card
                  key={worker._id}
                  className={`transition-all ${
                    selectedWorker === worker._id
                      ? 'ring-2 ring-primary-500 shadow-lg'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white font-medium flex-shrink-0">
                        {getInitials(worker.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold truncate">{worker.name}</h3>
                          {worker.isVerified && (
                            <span className="text-blue-500">✓</span>
                          )}
                          {selectedWorker === worker._id && (
                            <span className="ml-auto text-primary-600 font-medium">
                              ✓ Dipilih
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {worker.workCategories && worker.workCategories.length > 0 
                            ? worker.workCategories.map((cat: string) => 
                                cat.charAt(0).toUpperCase() + cat.slice(1)
                              ).join(', ')
                            : 'Pekerja Umum'
                          }
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{worker.rating || 0}</span>
                            <span>({worker.completedTasks || 0} tugas)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>✓</span>
                            <span>{worker.completedTasks || 0} selesai</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{worker.location || 'Tidak diketahui'}</span>
                          </div>
                          {worker.isAvailable !== false && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center space-x-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>Tersedia</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewWorkerDetail(worker)}
                            className="flex-1"
                          >
                            Lihat Detail
                          </Button>
                          {selectedWorker === worker._id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedWorker(null)}
                              className="flex-1 border-primary-500 text-primary-600"
                            >
                              Batal Pilih
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSelectWorker(worker._id)}
                              className="flex-1"
                            >
                              Pilih
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                {selectedWorker ? (
                  <div>
                    <p className="text-gray-600">Pekerja dipilih:</p>
                    <p className="font-semibold">
                      {workers.find((w) => w._id === selectedWorker)?.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Belum ada pekerja dipilih</p>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={!selectedWorker}
                className="min-w-[150px]"
              >
                Lanjutkan →
              </Button>
            </div>
          </div>
        </div>

        {/* Worker Detail Modal */}
        {showWorkerDetail && selectedWorkerData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Detail Pekerja</h2>
                <button
                  onClick={handleCloseWorkerDetail}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Profile Section */}
                <div className="text-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-2xl mx-auto mb-4">
                    {getInitials(selectedWorkerData.name)}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold">{selectedWorkerData.name}</h3>
                    {selectedWorkerData.isVerified && (
                      <span className="text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedWorkerData.location || 'Tidak diketahui'}</span>
                  </div>
                </div>

                {/* Rating & Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-bold text-lg">{selectedWorkerData.rating || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Briefcase className="h-5 w-5 text-gray-600" />
                      <span className="font-bold text-lg">{selectedWorkerData.completedTasks || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Tugas Selesai</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Kategori Keahlian
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkerData.workCategories && selectedWorkerData.workCategories.length > 0 ? (
                      selectedWorkerData.workCategories.map((category: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Tidak ada kategori</span>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Kontak
                  </h4>
                  <p className="text-gray-700">{selectedWorkerData.phone || 'Tidak tersedia'}</p>
                </div>

                {/* About */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Tentang
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedWorkerData.about || 'Tidak ada deskripsi tersedia'}
                  </p>
                </div>

                {/* Availability Status */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Status Ketersediaan
                  </h4>
                  {selectedWorkerData.isAvailable !== false ? (
                    <span className="inline-flex items-center space-x-2 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Tersedia untuk bekerja</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-2 text-red-700 bg-red-100 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Sedang tidak tersedia</span>
                    </span>
                  )}
                </div>

                {/* Reviews */}
                {selectedWorkerData.reviews && selectedWorkerData.reviews.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Ulasan Terbaru
                    </h4>
                    <div className="space-y-3">
                      {selectedWorkerData.reviews.slice(0, 3).map((review: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseWorkerDetail}
                    className="flex-1"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={handleSelectFromDetail}
                    className="flex-1"
                    disabled={selectedWorkerData.isAvailable === false}
                  >
                    {selectedWorker === selectedWorkerData._id ? 'Dipilih ✓' : 'Pilih Pekerja'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                {selectedWorker ? (
                  <div>
                    <p className="text-gray-600">Pekerja dipilih:</p>
                    <p className="font-semibold">
                      {workers.find((w) => w._id === selectedWorker)?.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Belum ada pekerja dipilih</p>
                )}
              </div>
              <Button
                onClick={handleContinue}
                disabled={!selectedWorker}
                className="min-w-[150px]"
              >
                Tugaskan Pekerja ✓
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}